import { getDatabase } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  try {
    await isAuthed(token);
    return {
      status: "ok",
      data: await getDatabase(),
    };
  } catch (e) {
    return {
      status: "failed",
      message: e,
    };
  }
});
