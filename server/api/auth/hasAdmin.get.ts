import {hasAdmin} from "~/server/utils/auth";

export default defineEventHandler(async _ => {
	return {
		status:  'ok',
		message: '',
		data: {
			has: await hasAdmin()
		}
	};
});
