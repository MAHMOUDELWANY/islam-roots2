sed -i 's/startServer();/export const appPromise = startServer();/g' server.ts
sed -i 's/app.listen(PORT, "0.0.0.0", () => {/if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) { app.listen(PORT, "0.0.0.0", () => {/g' server.ts
sed -i 's/console.log(`Islam Roots server listening on http:\/\/0.0.0.0:${PORT}`);/console.log(`Islam Roots server listening on http:\/\/0.0.0.0:${PORT}`); }); } return app;/g' server.ts
