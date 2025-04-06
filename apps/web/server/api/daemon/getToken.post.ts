export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const id = body.id;
  try {
    requireParam(id);
    await isAuthed(token);
    await hasTokenPermission(token, "mcsl.web.daemon." + id + ".access");
    return {
      status: "ok",
      data: {
        token: await getDaemonToken(await getUsernameByToken(token), id),
      },
    };
  } catch (e) {
    return {
      status: "failed",
      message: e,
    };
  }
});
