# Project Rules: Engineering Constitution

This document serves as the **Engineering Constitution** for ChatVerse. Every developer contributing to the Backend, Admin Panel, and Mobile apps must strictly adhere to these rules. It ensures scalability, maintainability, and absolute consistency across our platform.

---

## 1. Project Philosophy

- **Consistency is King:** Strict consistency across all codebases (Backend, Admin, Mobile).
- **Readability Over Cleverness:** Code is read more often than it is written. Make it clear.
- **Composition Over Duplication:** Never duplicate business logic. Build reusable, composable pieces.
- **SOLID Principles:** Follow SOLID principles where practical to ensure decoupled and testable code.
- **Single Responsibility:** Keep functions, components, and classes focused on one responsibility.

## 2. Documentation-First Workflow

- Update documentation before writing code.
- Any architectural change must be reflected in the `/docs` directory.
- `PROJECT_BRIEF.md`, `API_CONTRACT.md`, and `PROJECT_RULES.md` are the ultimate sources of truth.
- **Documentation Update Policy:** PRs will not be approved if documentation is outdated or missing for a new feature.

## 3. General Engineering Rules

- **NO DUPLICATION:** Never duplicate business logic.
- **NO HARDCODING:** Never hardcode configuration values, API endpoints, or user-facing strings.
- **NO CONSOLE.LOG:** Never use `console.log` in production code. Use a centralized logger.
- **ENVIRONMENT VARIABLES:** All secrets, keys, and environment-specific configs must be in `.env`.

---

## 4. Architecture & Organization

### 4.1 Folder Organization

A predictable folder structure is mandatory.

- **Backend:** `src/api` (routes, controllers), `src/services`, `src/repositories`, `src/models`, `src/middlewares`, `src/utils`, `src/config`.
- **Frontend (Admin/Mobile):** `src/components`, `src/screens`/`src/pages`, `src/hooks`, `src/store` (Zustand), `src/services` (API calls/TanStack), `src/constants`, `src/theme`, `src/utils`.

### 4.2 Backend Architecture (Route → Controller → Service → Repository)

Strict layer separation is required:

- **Routes:** Only handle routing and middleware attachment.
- **Controllers:** Handle HTTP request/response formatting. **Never directly access MongoDB inside controllers.**
- **Services:** Contain all business logic.
- **Repositories/Models:** Handle all direct database interactions (Mongoose queries).

### 4.3 React & React Native Architecture

- Presentational logic goes into reusable components.
- Screen/Page components handle layout and data fetching initialization.
- Complex state and side effects belong in custom hooks.
- **State Management:** Use **Zustand** for global client state. Use **TanStack Query** for server state (fetching, caching, mutations).

---

## 5. Coding Standards

### 5.1 File Naming Conventions

- **React Components/Screens:** PascalCase (e.g., `UserProfile.tsx`).
- **Hooks:** camelCase, prefixed with 'use' (e.g., `useAuth.ts`).
- **Utils/Constants/Services:** camelCase (e.g., `formatDate.ts`, `apiClient.ts`).
- **Types/Interfaces:** PascalCase (e.g., `UserTypes.ts`).

### 5.2 TypeScript Standards

- `any` is strictly prohibited. Define explicit interfaces or types.
- Export types and interfaces from a dedicated `types` folder or alongside the feature.
- Prefer `interface` for object shapes and `type` for unions/intersections.

### 5.3 Import Ordering

Group imports consistently with a blank line between groups:

1. Third-party libraries (e.g., `react`, `react-native`, `express`).
2. Absolute internal imports (e.g., `@/components/...`).
3. Relative internal imports (e.g., `../utils/...`).
4. Types and interfaces.

### 5.4 Socket Event Naming Conventions

- Use descriptive, colon-separated names: `<domain>:<action>`.
- Examples: `chat:request`, `chat:accept`, `user:online`, `wallet:update`.
- Keep event names stored in a shared constants file, never hardcoded in files.

### 5.5 Constant Management

- All magic numbers, configuration limits, and fixed strings must live in `src/constants`.
- Constants must be `UPPER_SNAKE_CASE` (e.g., `MAX_MESSAGE_LENGTH`, `COMMISSION_RATE`).

### 5.6 Utility Function Rules

- Must be pure functions whenever possible.
- Must not have side effects.
- Must be covered by unit tests.

### 5.7 Hook Conventions

- Do not mix business logic with UI components; extract logic into custom hooks.
- Hooks should return only the necessary state and methods.

---

## 6. Design System & UI/UX

### 6.1 Reusable Component Philosophy

- Build atomic UI components (Button, Input, Card) before assembling complex screens.
- Components must be flexible, accepting style overrides without breaking internal logic.

### 6.2 Theme Management & Styling

- **Admin:** Use TailwindCSS utility classes. Centralize custom colors/fonts in `tailwind.config.js`.
- **Mobile (React Native):** Centralize all theme properties (colors, spacing, typography) in a `src/theme` directory.
- Avoid inline styling.

### 6.3 Typography, Color, and Spacing

- **Typography:** Define a strict hierarchy (Heading 1-6, Body, Caption). Do not use arbitrary font sizes.
- **Color Usage:** Use semantic names (`primary`, `secondary`, `danger`, `success`, `background`, `surface`, `textMain`) rather than direct hex codes.
- **Spacing System:** Use a 4px or 8px grid system. No arbitrary margins or paddings (e.g., use `m-4` or `spacing.md`, never `margin: 17px`).

### 6.4 Animation Principles

- Keep animations subtle, performant, and purposeful.
- Use native driver (`useNativeDriver: true` in RN) or Reanimated for mobile.
- Use CSS transitions in the Admin panel.

---

## 7. Data, API & Validation

### 7.1 API Response Standards

Every API must return a consistent JSON envelope:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "message": "User-friendly message (if applicable)",
  "error": { "code": "ERR_CODE", "details": "..." } | null
}
```

### 7.2 Error Handling Strategy

- **Backend:** Centralized error-handling middleware. Do not leak stack traces in production. Use custom AppError classes extending the native `Error`.
- **Frontend:** Catch errors globally where possible. Display user-friendly toasts/alerts. Never crash the app on an API failure.

### 7.3 Authentication Strategy

- JWT-based authentication.
- Access tokens should have a short lifespan.
- Refresh tokens (if used) must be securely stored (HttpOnly cookies for Web, Secure Storage for Mobile).

### 7.4 Form Validation

- Use **Formik** for form state management.
- Use **Yup** for validation schemas.
- Schemas must be defined outside the component or in a dedicated validations file.

---

## 8. Best Practices

### 8.1 Logging Rules

- Use a robust logger (e.g., Winston, Pino) on the backend.
- Log formats must include timestamps, correlation IDs (if applicable), and severity levels (INFO, WARN, ERROR).
- Do not log sensitive user data (PII, passwords, tokens).

### 8.2 Security Best Practices

- Never trust client data; validate everything on the server.
- Implement rate limiting and helmet on the backend.
- Sanitize database inputs to prevent NoSQL injection.
- Secure WebSockets by validating tokens on the handshake/connection.

### 8.3 Performance Optimization Guidelines

- **React/RN:** Memoize heavy computations (`useMemo`) and stable callbacks (`useCallback`). Use `React.memo` for heavy pure components.
- **Backend:** Index MongoDB collections properly. Use pagination for all list endpoints.
- **Images:** Compress and cache images. Use FastImage in React Native.

### 8.4 Accessibility Guidelines

- **Admin:** Ensure ARIA labels, semantic HTML, and keyboard navigability.
- **Mobile:** Use `accessibilityLabel`, `accessibilityRole`, and proper contrast ratios.

### 8.5 Commenting Guidelines

- Code should be self-documenting (good variable/function names).
- Use comments to explain **WHY**, not **WHAT**.
- Add JSDoc to complex utility functions, services, and hooks.

---

## 9. Version Control & Review

### 9.1 Branch Naming Conventions

- `feature/<ticket-id>-brief-description`
- `bugfix/<ticket-id>-brief-description`
- `hotfix/<ticket-id>-brief-description`
- `release/vX.Y.Z`

### 9.2 Git Commit Conventions

Follow Conventional Commits:

- `feat: add Google login`
- `fix: resolve coin deduction bug`
- `chore: update dependencies`
- `docs: update PROJECT_RULES`

### 9.3 Code Review Checklist

Before approving a PR, ensure:

1. No `console.log` or debug code remains.
2. Logic is in the correct architectural layer.
3. Types are strictly defined (no `any`).
4. Reusable components were used where possible.
5. Constants are extracted.
6. Documentation is updated.

### 9.4 Testing Philosophy

- Write unit tests for core business logic (Services, Utilities).
- Write integration tests for critical API routes.
- Ensure test files are co-located or strictly organized in a `__tests__` directory.

---

_This document is a living constitution. It must evolve with the project but requires explicit architectural approval for significant changes._
