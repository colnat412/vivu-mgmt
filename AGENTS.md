# Vi Vu Admin

- User requested Next.js + shadcn/ui in this directory. Tailwind is intentional for shadcn; do not import MUI or change the customer web app.
- Follow ../trip-budget-web/AGENTS.md for SSR-first, shared Axios/BFF/hooks, 300ms debounced search, query cancellation, VI/EN, theme/radius tokens, primary navy→sky gradient, loading/error/empty states, and preservation of existing user work.
- Use src/base for shared components/providers/API/hooks, src/features for business features. Server pages/layouts; client boundaries only for interactions.
- Flexbox with parent gap/padding. No feature layout margins, absolute positioning, unnecessary CSS Grid. Radix overlay positioning is allowed for accessible dialogs.
- Admin data comes from Core /api/admin/**. No mock users/counts and no direct PostgreSQL/Redis access in Next.js.
- HttpOnly admin-specific cookies, same-origin mutation checks, backend authorization on every action. Never expose passwords, tokens, API keys, or refresh hashes.
- Run typecheck, scoped ESLint, tests and production build. Skip browser/smoke per inherited user instructions.

## Admin implementation — 23/11/2026

- Reuse public/icon.svg and favicon.ico byte-for-byte from trip-budget-web. Do not invent another brand mark. Manrope subsets are copied from the existing build.
- Admin allowlist is server-only ADMIN_EMAILS; user chose admin@gmail.com. Never create a sample account/password.
- DELETED is the disable state; ACTIVE/INACTIVE retain OTP verification. Preserve status_before_deletion on restore. One disable/restore action only.
- User details allow name/email changes and avatar removal; never expose password/token/hash or edit policy acceptance on behalf of users. Email changes reset verification and revoke sessions.
- Core UserEntity extends BaseEntity. V15 adds is_del and saved verification status, admin settings/audit tables. Apply migration before compiling/restarting live Core; do not execute it on application DB without explicit permission.
- Tested 10 BFF/policy/brand/locale/logout checks, typecheck/lint/build; Core unit tests and opt-in PostgreSQL test script. See README for current rollout limitations.

## UI identity layout — 23/11/2026

- User explicitly chose source-only delivery: do not apply V15 to the application DB or restart Core for this task.
- Shared .stack/.row belong in Tailwind components layer so gap-* utilities can override defaults. Both profile header and topbar use account-copy with a 4px parent gap.
- Shared avatar is a fixed 38px square, circular/overflow-hidden; img has explicit width/height 100% and object-fit cover so portrait images cannot stretch the container. Keep existing uploaded images and brand assets.

## Minimal copy — 23/11/2026

- User prefers concise labels: omit sidebar section labels, access-only reminders, marketing copy and page subtitles that restate headings. Login is a simple centered form with the existing logo. Keep explanations for actual consequences (email re-verification, disable/restore and session revocation).
- User explicitly deferred online status; do not implement it for this task. Online status is not implemented: auth Redis sessions only store creation/expiry; push-device lastSeenAt updates on device registration and is not presence. Do not label verified users or unexpired sessions as online.

## Pagination matches Trip-web — 23/11/2026

- Shared table footer follows AppTablePagination/AppPagination in trip-budget-web: displayed row range, 5/10/20/50 page-size selector, numbered buttons, ellipses and arrow controls. Selected number has a primary outline; 32px visible control inside 44px hit area.
- Users and audit send the selected size to Core and reset to page zero when size changes. API page indexes remain zero-based; UI labels are one-based. Responsive boundary counts keep mobile controls compact. No MUI dependency.
