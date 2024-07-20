import type {Ref} from 'vue';
import {ref, watch} from 'vue';

export enum TaskStatus {
	Done,
	Processing,
	Fail,
}

export class SimpleTask {
	static lastId = -1;
	private readonly _name: Ref<string>;
	private readonly _desc: Ref<string>;
	private readonly _status: Ref<TaskStatus>;
	private readonly _createTime: number;
	private readonly _id: number;
	private _finishTime: number | undefined;

	constructor(name: string, desc: string) {
		this._name = ref(name);
		this._desc = ref(desc);
		this._status = ref(TaskStatus.Processing);
		this._createTime = Date.now();
		this._id = ++SimpleTask.lastId;
		addTask(this);
	}

	fail() {
		this._status.value = TaskStatus.Fail;
		this._finishTime = Date.now();
	}

	done() {
		this._status.value = TaskStatus.Done;
		this._finishTime = Date.now();
	}

	setName(name: string) {
		this._name.value = name;
	}

	setDesc(desc: string) {
		this._desc.value = desc;
	}

	get name(): Ref<string> {
		return this._name;
	}

	get desc(): Ref<string> {
		return this._desc;
	}

	get status(): Ref<TaskStatus> {
		return this._status;
	}

	get createTime(): number {
		return this._createTime;
	}

	get id(): number {
		return this._id;
	}

	get finishTime(): number | undefined {
		return this._finishTime;
	}
}

export class ProgressTask extends SimpleTask {
	private readonly _progress: Ref<number>;
	private readonly autoDone: boolean;

	constructor(name: string, desc: string, autoDone = true) {
		super(name, desc);
		this._progress = ref(0);
		this.autoDone = autoDone;
	}

	setProgress(progress: number) {
		this._progress.value = progress;
		if (this._progress.value >= 100 && this.autoDone) {
			this.done();
		}
	}

	addProgress(addition: number) {
		this._progress.value += addition;
		if (this._progress.value >= 100 && this.autoDone) {
			this.done();
		}
	}

	get progress(): Ref<number> {
		return this._progress;
	}
}

export class RefProgressTask extends SimpleTask {
	private progress: any;

	constructor(
		name: string,
		desc: string,
		progress: Ref<number>,
		autoDone = true,
	) {
		super(name, desc);
		this.progress = progress;
		watch(progress, (newValue) => {
			if (newValue >= 100 && autoDone) {
				this.done();
			}
		});
	}
}

export class PromiseTask extends SimpleTask {
	constructor(name: string, desc: string, promise: Promise<any>) {
		super(name, desc);
		promise
			.then(() => {
				this.done();
			})
			.catch(() => {
				this.fail();
			});
	}
}

export const tasks: Ref<SimpleTask[]> = ref([]);

export function addTask(task: SimpleTask) {
	tasks.value.unshift(task);
}
