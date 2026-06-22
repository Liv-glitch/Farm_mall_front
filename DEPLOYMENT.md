# Frontend cPanel Deployment

This frontend can be packaged for the Namecheap/cPanel Node app with one local
command.

## One-time setup

Create a production env file:

```bash
cp .env.example .env.production.local
```

Then edit `.env.production.local` and set the real values, especially:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

`NEXT_PUBLIC_API_BASE_URL` is baked into the browser bundle at build time, so a
change to that value requires rebuilding. `OPENWEATHER_API_KEY` should also be
set in the cPanel Node app environment because it is used at runtime.

## Package for upload

```bash
npm run deploy:package
```

This builds the app and creates:

```text
dist/farmmall-frontend-cpanel.zip
```

Upload that zip to the cPanel Node app folder, unzip it there, run/install npm
dependencies if cPanel has not already done so, and restart the Node app.

## Optional: use another env file

```bash
ENV_FILE=/path/to/env.production npm run deploy:package
```

