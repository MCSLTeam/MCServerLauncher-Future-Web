import { hasAdmin } from '~/server/utils/auth';

export default defineEventHandler(async () => {
	return {
		status: 'ok',
		message: '',
		data: {
			has: await hasAdmin(),
		},
	};
});
