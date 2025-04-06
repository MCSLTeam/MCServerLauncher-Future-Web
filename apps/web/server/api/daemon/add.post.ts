export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const token = body.token;
    const info = body.info;
    try {
        requireParam(info);
        await isAuthed(token);
        await hasTokenPermission(token, "mcsl.web.daemon.add");
        await addDaemon(info);
        return {
            status: "ok",
        };
    } catch (e) {
        return {
            status: "failed",
            message: e,
        };
    }
});
