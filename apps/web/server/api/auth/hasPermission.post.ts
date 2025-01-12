export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const permission = body.permission;
  try {
    requireParam(permission);
    await isAuthed(token);
    return {
      status: "ok",
      data: {
        has: await hasPermission(await getUsernameByToken(token), permission),
      },
      message: "",
    };
  } catch (e) {
    return {
      status: "failed",
      message: e,
    };
  }
});
