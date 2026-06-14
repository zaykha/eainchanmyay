Changelog

## [1.0.0] - 2025-03-08

### Highlights
- Added localization across the site UI (Burmese default, English, Chinese, Thai).
- Refined activities, listing cards, filters, and mobile UI behaviors.
- Added caching, rate limiting, and improved API responses.

### Changes
- Activities: richer card detail + compact mobile layout; edit flows updated.
- Listings: thumbnails, property type icons, area/city/township rows, price formatting.
- Filters: custom dropdowns, dynamic bed/bath/area fields, mobile full-height popup.
- Settings: new support/FAQ/terms/privacy pages, language picker in top nav.
- Security/perf: API rate limits; CDN cache headers; localStorage listing cache.

### Developer
- Added `npm run check` (lint + typecheck) and adjusted lint config.
- Fixed build requirements with Suspense wrappers for pages using `useSearchParams`.
