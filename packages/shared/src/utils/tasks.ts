import { computed, type Ref, ref, watch } from "vue";
import type { LoadingStatus } from "@repo/ui/src/utils/types.ts";
import { sleep } from "@repo/ui/src/utils/util.ts";

export class SimpleTask {
  static lastId = -1;

  public readonly name: Ref<string>;
  public readonly desc: Ref<string>;
  public readonly status: Ref<LoadingStatus>;
  public readonly createTime: number;
  public readonly id: number;
  public readonly progress = computed(() => this._progress.value);
  private readonly _progress: Ref<number>;
  private _finishTime: number | undefined;

  constructor(
    name: string,
    desc: string,
    progress = ref(0),
    autoSuccess = true,
  ) {
    this.name = ref(name);
    this.desc = ref(desc);
    this.status = ref("loading");
    this.createTime = Date.now();
    this.id = ++SimpleTask.lastId;
    this._progress = progress;
    watch(progress, (newValue) => {
      if (newValue >= 100 && this.status.value == "loading" && autoSuccess) {
        this.success();
      }
    });
    addTask(this);
  }

  success() {
    this._progress.value = 100;
    this.status.value = "success";
    this._finishTime = Date.now();
  }

  warning() {
    this.status.value = "warning";
    this._finishTime = Date.now();
  }

  error() {
    this.status.value = "error";
    this._finishTime = Date.now();
  }

  addProgress(addition = 1) {
    this.setProgress(this._progress.value + addition);
  }

  setProgress(progress: number) {
    if (this.status.value == "loading") this._progress.value = progress;
  }

  get finishTime() {
    return this._finishTime;
  }
}

export class FakeLoadingTask extends SimpleTask {
  private shouldIncrease = false;

  constructor(
    name: string,
    desc: string,
    autoStart = true,
    autoSuccess = true,
  ) {
    super(name, desc, ref(0), autoSuccess);
    if (autoStart) this.start();
    watch(this.status, (value) => {
      if (value != "loading") this.stop();
    });
  }

  start() {
    if (!this.shouldIncrease) {
      this.shouldIncrease = true;
      this.increase();
    }
  }

  stop() {
    this.shouldIncrease = false;
  }

  private async increase() {
    if (this.shouldIncrease && this.progress.value < 99) {
      this.addProgress();
      let factor;
      if (this.progress.value < 50) factor = 1.02;
      else if (this.progress.value < 90)
        factor = 1.02 + 0.00075 * (this.progress.value - 60);
      else factor = 1.05 + 0.003 * (this.progress.value - 90);
      await sleep(50 * factor ** this.progress.value);
      await this.increase();
    }
  }
}

export class PromiseTask extends FakeLoadingTask {
  constructor(
    name: string,
    desc: string,
    promise: Promise<any>,
    errorStatus: (e: any) => "warning" | "error" = () => "error",
    autoSuccess = true,
  ) {
    super(name, desc, true, autoSuccess);
    promise
      .then(() => {
        this.success();
      })
      .catch((e) => {
        const status = errorStatus(e);
        this[status]();
      });
  }

  start() {}

  stop() {}
}

export const tasks: Ref<SimpleTask[]> = ref([]);

export function addTask(task: SimpleTask) {
  tasks.value.unshift(task);
}

export function removeTask(task: SimpleTask) {
  tasks.value = tasks.value.filter((t) => t !== task);
}
