# Session Log

## Previous Session

- **What**: Fixed Netlify build blockers — secrets scan, middleware→proxy rename, merged to main
- **Why it matters**: `main` is deployable; deprecation warning gone
- **Next step**: Was: confirm Netlify build, update Auth0 dashboard, test production login

## Current Session

- **What**: Removed `APP_BASE_URL` from `.env`, `.env.example`, and Netlify dashboard — Auth0 v4 infers base URL from request host automatically
- **Why it matters**: Fixes production redirect bouncing to localhost; no env var to manage across environments
- **Next step**: Confirm production login flow works end-to-end on Netlify URL
