// Custom Next.js server entry for cPanel Node App (Phusion Passenger).
// Set this file as the "Application startup file" in the cPanel Node.js App UI.
// Build first with `npm run build`, then cPanel starts the app via this file.
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Passenger / cPanel provides PORT. Always run in production mode here.
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`> FarmMall frontend ready on port ${port}`);
  });
});
