export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const id = body.id;
  const info = body.info;
  try {
    requireParam(id, info);
    await isAuthed(token);
    await hasTokenPermission(token, "mcsl.web.daemon." + id + ".update");
    await updateDaemon(id, info);
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
