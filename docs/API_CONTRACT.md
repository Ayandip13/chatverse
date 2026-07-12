# API Contract: ChatVerse

This document defines the complete REST API contract for the ChatVerse platform. It serves as the definitive implementation blueprint for backend and frontend teams, eliminating ambiguity in request/response structures, error handling, and endpoint behavior.

---

## 1. API Design Principles & Philosophy
- **RESTful Naming:** URLs represent resources (nouns, plural), not actions (verbs). E.g., `POST /api/v1/users`, not `/api/v1/createUser`.
- **Versioning:** All APIs reside under `/api/v1`. Breaking changes will necessitate `/api/v2` while maintaining `v1` backward compatibility until deprecated.
- **Stateless:** APIs are entirely stateless. Authentication relies on JWTs passed in the `Authorization` header.
- **Idempotency:** `PUT` and `DELETE` requests are idempotent. Transactional `POST` requests (like wallet recharges) must utilize idempotency keys or unique transaction IDs.

---

## 2. Standard Response Format
To ensure frontend predictability, every response uses a strict JSON envelope.

### 2.1 Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional user-friendly message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 2.2 Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE_ENUM",
    "message": "Developer-friendly error message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```
**HTTP Status Codes:** `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `429 Too Many Requests`, `500 Internal Server Error`.

---

## 3. Pagination, Search, and Filtering
- **Query Parameters:** `?page=1&limit=20&sort=-createdAt&search=keyword&status=ACTIVE`
- **Response Structure:** Includes the `meta` block (see Success Response).

---

## 4. Endpoint Catalogue

### 4.1 Authentication APIs
- **POST `/api/v1/auth/register`**
  - **Purpose:** Register Boy/Girl.
  - **Body:** `{ email, password, role, name, phone (if girl) }`
- **POST `/api/v1/auth/login`**
  - **Purpose:** Email/Password login.
  - **Success:** `{ accessToken, refreshToken, user }`
- **POST `/api/v1/auth/google`**
  - **Purpose:** Google OAuth login/registration.
  - **Body:** `{ idToken, role }`
- **POST `/api/v1/auth/refresh`**
  - **Purpose:** Exchange refresh token for access token.
- **POST `/api/v1/auth/logout`**
  - **Auth:** Required. Invalidates token.

### 4.2 Profile APIs
- **GET `/api/v1/users/me`**
  - **Auth:** Required. Returns current user profile.
- **PATCH `/api/v1/users/me`**
  - **Body:** `{ name, bio, ... }`
- **POST `/api/v1/users/me/avatar`**
  - **Purpose:** Upload profile picture (Multipart Form-Data).
- **DELETE `/api/v1/users/me`**
  - **Purpose:** Soft delete account.

### 4.3 Girl Discovery APIs (Boys App)
- **GET `/api/v1/girls`**
  - **Purpose:** List girls for discovery.
  - **Filters:** `?isOnline=true&sort=-rating`
- **GET `/api/v1/girls/:id`**
  - **Purpose:** View detailed girl profile and stats.
- **POST `/api/v1/girls/:id/favorite`**
  - **Purpose:** Add to favorites.
- **DELETE `/api/v1/girls/:id/favorite`**
  - **Purpose:** Remove from favorites.

### 4.4 Wallet & Payment APIs
- **GET `/api/v1/wallet`**
  - **Purpose:** Get wallet summary (balance, lifetime stats).
- **POST `/api/v1/wallet/recharge`**
  - **Purpose:** Create Razorpay order for Boy.
  - **Body:** `{ amountInr }`
- **POST `/api/v1/wallet/verify`**
  - **Purpose:** Verify Razorpay webhook/client signature.
- **GET `/api/v1/wallet/transactions`**
  - **Purpose:** Paginated transaction history.

### 4.5 Chat Request APIs
- **POST `/api/v1/chat-requests`**
  - **Purpose:** Boy sends request to Girl.
  - **Body:** `{ targetUserId }`
- **POST `/api/v1/chat-requests/:id/accept`**
  - **Auth:** Target Girl only.
- **POST `/api/v1/chat-requests/:id/reject`**
  - **Auth:** Target Girl only.
- **POST `/api/v1/chat-requests/:id/cancel`**
  - **Auth:** Sender Boy only.

### 4.6 Chat APIs
- **GET `/api/v1/chats`**
  - **Purpose:** List active or historical chats.
- **GET `/api/v1/chats/:id/messages`**
  - **Purpose:** Paginated chat history (REST fallback/sync for Socket.IO).
- **POST `/api/v1/chats/:id/end`**
  - **Purpose:** Manually end an active chat.

### 4.7 Rating APIs
- **POST `/api/v1/chats/:id/ratings`**
  - **Purpose:** Boy rates a Girl after a chat.
  - **Body:** `{ score, comment }`
- **PATCH `/api/v1/ratings/:id`**
  - **Purpose:** Update a previous rating.

### 4.8 Report APIs
- **POST `/api/v1/reports`**
  - **Purpose:** Report a user.
  - **Body:** `{ targetUserId, reason, evidence, chatId? }`

### 4.9 Notification APIs
- **GET `/api/v1/notifications`**
  - **Purpose:** Paginated list of user notifications.
- **PATCH `/api/v1/notifications/:id/read`**
  - **Purpose:** Mark as read.

### 4.10 Withdrawal APIs (Girls)
- **GET `/api/v1/withdrawals`**
  - **Purpose:** Girl's withdrawal history.
- **POST `/api/v1/withdrawals`**
  - **Purpose:** Request payout.
  - **Body:** `{ amount, upiId }`

### 4.11 Admin APIs
**Auth:** Admin Token Required.
- **GET `/api/v1/admin/dashboard`** (Platform analytics)
- **GET `/api/v1/admin/users`** (Manage all users)
- **PATCH `/api/v1/admin/users/:id/status`** (Ban/Suspend/Approve)
- **GET `/api/v1/admin/withdrawals`** (Queue)
- **POST `/api/v1/admin/withdrawals/:id/process`** (Approve/Reject)
- **GET `/api/v1/admin/reports`** (Moderation queue)
- **GET `/api/v1/admin/settings`** (Get platform settings)
- **PATCH `/api/v1/admin/settings`** (Update Commission, limits)

---

## 5. Security & Authorization
- **JWT:** Access tokens expire quickly (e.g., 15m). Refresh tokens are HTTP-only secure cookies (Web) or encrypted storage (Mobile).
- **Authorization Header:** `Authorization: Bearer <token>`
- **Role-Based Access (RBAC):** Middleware validates roles (`boy`, `girl`, `admin`).
- **Rate Limiting:** IP-based and User-based rate limiting (e.g., 100 requests / 15 min). Chat Request endpoints are strictly rate-limited to prevent spam.
- **Input Validation:** Joi or Zod schemas validate ALL incoming payloads. Unexpected keys are stripped.

---

## 6. Standard Error Catalogue
The `error.code` field ensures frontends can localize error messages without parsing strings.
- `INVALID_CREDENTIALS`: Login failed.
- `TOKEN_EXPIRED`: JWT expired.
- `UNAUTHORIZED`: Missing/invalid token.
- `FORBIDDEN`: Lacks role permissions.
- `INSUFFICIENT_COINS`: Wallet balance too low.
- `GIRL_NOT_APPROVED`: Action requires verified status.
- `USER_BANNED`: Account suspended/banned.
- `CHAT_NOT_FOUND`: Resource missing.
- `WITHDRAW_LIMIT`: Requested amount outside allowed bounds.
- `VALIDATION_ERROR`: Payload failed schema checks.
- `PAYMENT_FAILED`: Razorpay capture failed.
- `REPORT_ALREADY_EXISTS`: Duplicate report submission.

---

## 7. Future Expansion Readiness
- **Pagination Strategy:** Cursor-based pagination can be seamlessly introduced alongside offset-based via query params.
- **Media Uploads:** APIs are designed to return pre-signed S3 URLs for future video/image uploads without passing binaries through Node.js.
- **Webhooks:** `/api/v1/webhooks/razorpay` is isolated to allow scaling independent of core business logic.
- **Subscriptions/Coupons:** Can be easily mounted on `/api/v1/subscriptions` without altering existing structures.
