export default defineEventHandler(async () => {
  try {
    return {
      status: "ok",
      message: "",
      data: {
        has: await hasAdmin(),
      },
    };
  } catch (e) {
    return {
      status: "failed",
      message: e,
    };
  }
});
