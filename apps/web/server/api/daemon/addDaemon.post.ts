export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const name = body.name;
  const info = body.info;
  try {
    requireParam(name, info);
    await isAuthed(token);
    await matchTokenPermission(token, "mcsl.web.daemon.add");
    await addDaemon(name, info);
  } catch (e) {
    return {
      status: "failed",
      message: e,
    };
  }
});
