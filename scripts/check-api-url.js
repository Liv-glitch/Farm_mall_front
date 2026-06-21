// Build-time sanity check: in production the frontend must be built with a real
// NEXT_PUBLIC_API_BASE_URL (it is baked into the bundle at build time). Fail the
// build early if it is missing or still pointing at localhost.
const url = process.env.NEXT_PUBLIC_API_BASE_URL;
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  if (!url) {
    console.error(
      '\n[check-api-url] NEXT_PUBLIC_API_BASE_URL is not set for a production build.\n' +
      'Set it to your backend URL (e.g. https://api.yourdomain.com) before building.\n'
    );
    process.exit(1);
  }
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.error(
      `\n[check-api-url] NEXT_PUBLIC_API_BASE_URL="${url}" points at localhost in a production build.\n` +
      'Set it to your public backend URL (e.g. https://api.yourdomain.com) before building.\n'
    );
    process.exit(1);
  }
  console.log(`[check-api-url] OK — building against API base URL: ${url}`);
} else {
  console.log(`[check-api-url] dev build — API base URL: ${url || '(unset, defaults apply)'}`);
}
