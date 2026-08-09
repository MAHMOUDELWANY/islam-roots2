const server = require("../dist/server.cjs");
module.exports = async (req, res) => {
  const app = await server.appPromise;
  return app(req, res);
};
