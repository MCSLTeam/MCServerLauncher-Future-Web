import {getUsers} from '~/server/utils/auth';

export default defineEventHandler(async () => {
	return {
		status: 'ok',
		message: '',
		data: {
			users: await getUsers()
		}
	};
});