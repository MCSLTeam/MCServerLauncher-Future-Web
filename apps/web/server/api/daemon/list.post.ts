export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const token = body.token;
    try {
        await isAuthed(token);
        return {
            status: "ok",
            data: await getDaemonListWithToken(token),
        };
    } catch (e) {
        return {
            status: "failed",
            message: e,
        };
    }
});
