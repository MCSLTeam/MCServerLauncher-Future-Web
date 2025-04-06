export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const id = body.id;
  try {
    requireParam(id);
    await isAuthed(token);
    await hasTokenPermission(token, "mcsl.web.daemon." + id + ".remove");
    await removeDaemon(id);
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
