import {removeUser} from '~/server/utils/auth';

export default defineEventHandler( async (event) =>{
	const body = await readBody(event);
	const username = body.username;
	try{
		removeUser(username);
		return {
			status: 'ok',
			message: '',
		}
	}catch (e){
		return {
			status: 'error',
			message: e,
		}
	}
});