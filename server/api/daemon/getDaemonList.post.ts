export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const token = body.token;
    try {
        await isAuthed(token)
        const daemons = [];
        for (const daemon in await getDaemons()) {
            try {
                await matchTokenPermission(token, 'mcsl.web.daemon.' + daemon + '.access')
                daemons.push(daemon);
            } catch (ignored) {
            }
        }
        return {
            status: 'ok',
            data: {
                daemons: daemons,
            },
            message: '',
        };
    } catch (e) {
        return {
            status: 'failed',
            message: e,
        };
    }
});
