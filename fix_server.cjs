const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Find the section that was messed up
const searchStr = `  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) { app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Islam Roots server listening on http://0.0.0.0:\${PORT}\`); }); } return app;
  });
}

export const appPromise = startServer();`;

if (content.includes(searchStr)) {
    content = content.replace(searchStr, `  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) { 
    app.listen(PORT, "0.0.0.0", () => {
      console.log(\`Islam Roots server listening on http://0.0.0.0:\${PORT}\`);
    });
  }
  return app;
}

export const appPromise = startServer();`);
    fs.writeFileSync('server.ts', content);
    console.log('Fixed');
} else {
    console.log('Not found, trying alternative');
    // Just find the block manually
    content = content.replace(/if \(process\.env\.NODE_ENV[\s\S]*?export const appPromise = startServer\(\);/m, 
`  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(\`Islam Roots server listening on http://0.0.0.0:\${PORT}\`);
    });
  }
  return app;
}

export const appPromise = startServer();`);
    fs.writeFileSync('server.ts', content);
}
