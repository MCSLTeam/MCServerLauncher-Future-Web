import { saveDatabase } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  const data = body.data;
  try {
    requireParam(data);
    await isAuthed(token);
    await saveDatabase(data);
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
