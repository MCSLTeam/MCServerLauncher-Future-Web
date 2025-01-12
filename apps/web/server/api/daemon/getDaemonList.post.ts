import type { MFPClientInfo } from "mfp-client/dist/src/types";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = body.token;
  try {
    await isAuthed(token);
    const daemons = await getDaemons();
    const res: { [key: string]: MFPClientInfo } = {};
    for (const daemon in Object.keys(daemons)) {
      if (
        await hasTokenPermission(token, "mcsl.web.daemon." + daemon + ".access")
      ) {
        res[daemon] = daemons[daemon];
      }
    }
    return {
      status: "ok",
      data: {
        daemons: daemons,
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
