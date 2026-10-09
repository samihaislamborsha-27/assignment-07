# বাজার দর / BazarDor

A Bangla grocery price website for checking daily prices,
comparing markets, and tracking price changes.

## Links
- Live website: To be added after deployment
- GitHub: https://github.com/samihaislamborsha-27/assignment-07

## Technologies
Next.js, React, TypeScript, Tailwind CSS, Better Auth,
MongoDB, and React Hot Toast.

## Features
1. Daily grocery prices with Bengali numbers and units.
2. Top six price increases and decreases on the homepage.
3. Eight product categories with numeric price sorting.
4. Email/password, Google, and GitHub authentication.
5. Protected product details with market comparisons.
6. Minimum, maximum, and average price summaries.
7. Dedicated profile editing for names and photos.
8. Responsive layouts for mobile, tablet, and desktop.
9. Scrolling price ticker and active category navigation.
10. Loading skeletons, notifications, and a Bangla 404 page.

## Local Setup
Run npm install inside the bazardor folder.

Configure .env.local with:
MONGODB_URI, MONGODB_DB, BETTER_AUTH_URL, BETTER_AUTH_SECRET,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
GITHUB_CLIENT_ID, and GITHUB_CLIENT_SECRET.

For local development, use:
BETTER_AUTH_URL=http://localhost:3000

OAuth callback URLs:
Google: http://localhost:3000/api/auth/callback/google
GitHub: http://localhost:3000/api/auth/callback/github

Run npm run dev and open http://localhost:3000.
Keep .env.local out of Git.

## Production
Build: npm run build
Start: npm run start

## Data Sources
Primary: https://api.api-store.workers.dev/api/bazardor
Alternative: https://api.abcz.workers.dev/api/bazardor

Prices are indicative and may vary by market.
