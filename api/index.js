process.env.IS_VERCEL = "true";

let appInstance;

export default async function handler(req, res) {
  if (!appInstance) {
    const server = await import("../dist/server.cjs");
    // Depending on how Node/Vercel handles CJS imports, appPromise might be on the default export or directly on the object.
    appInstance = await (server.appPromise || server.default.appPromise);
  }
  return appInstance(req, res);
}
