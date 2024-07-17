export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const token = body.token;
    const expire =  await getTokenExpire(token)
    if(expire == 'expired'){
        return {
            status: 'failed',
            message: 'Token已过期或不存在',
        };
    }else {
        return {
            status: 'ok',
            data: {
                "expire": expire
            },
            message: '',
        };
    }
});
