# Business Rules: ChatVerse

This document defines the absolute business logic and operational rules for the ChatVerse platform. It governs system behavior under normal, edge, and exceptional conditions to eliminate ambiguity during implementation. This is the single source of truth for platform behavior.

---

## 1. Authentication Rules

### Registration & Login
- **Purpose:** Securely identify and authenticate users.
- **Trigger:** User opens app and submits credentials (Email/Password or Google OAuth).
- **Expected Behavior:** 
  - Boys are granted instant access with an `ACTIVE` status.
  - Girls are registered but placed in a `PENDING` status. They cannot access core features until Admin verified.
- **Session Handling:** Stateless JWTs. Access tokens have short lifespans; Refresh tokens are rotated. Multiple devices are allowed, but sessions can be universally invalidated by an Admin.
- **Account Ban/Suspension:** Banned users attempting to log in receive a specific "Banned" error message. Active sessions for a banned user are immediately invalidated (WebSockets disconnected, tokens blacklisted/version bumped).

## 2. Girl Verification Rules

### Approval Flow
- **Purpose:** Ensure only legitimate, verified females provide services.
- **Trigger:** Girl completes registration.
- **Expected Behavior:** 
  - Status = `PENDING`. UI blocks chat/wallet access.
  - Admin manually calls the registered phone number.
  - Admin approves or rejects via the Admin Panel.
  - If `APPROVED`, full access is granted, and the profile becomes visible to Boys.
  - If `REJECTED`, the account remains locked. Re-application is allowed only if explicitly enabled by an Admin.
- **Profile Edits:** Core identity fields (Name, Phone) cannot be changed after approval without triggering a re-verification (`PENDING` state).

## 3. Wallet & Coin Rules

### Coin Policy & Valuation
- **Rule:** ₹1 INR = 1 Coin. 100 Coins = 10 Minutes (10 Coins per Minute).
- **Purpose:** Standardize the platform economy.
- **Deduction Timing:** Coins are deducted *only* for completed minutes. E.g., 3m 40s = 3 minutes charged.
- **Trigger:** Initiates exactly when a Girl accepts a Chat Request.
- **Commission:** Configurable percentage (e.g., 20%). If 10 coins are deducted, Girl earns 8, Platform retains 2.

### Wallet Recharge & Balances
- **Expected Behavior:** 
  - Boys recharge via Razorpay. Coins are credited instantly upon successful payment webhook.
  - Wallet balances are stored as an integer (Coins/INR).
  - A Boy cannot send a Chat Request if his balance is strictly < 10 Coins (1 minute).

## 4. Chat Request Rules

### Request Lifecycle
- **Purpose:** Handshake before paid billing starts.
- **Trigger:** Boy clicks "Send Request".
- **Expected Behavior:**
  - System verifies Boy has > 10 coins.
  - Request sent to Girl. Status = `PENDING`.
  - If Girl accepts: Status = `ACCEPTED`. Chat session begins.
  - If Girl rejects: Status = `REJECTED`. Boy is notified. No coins deducted.
- **Expiration:** Requests automatically expire if unaccepted within 60 seconds (`EXPIRED`).
- **Cancellation:** Boy can cancel before acceptance (`CANCELLED`).
- **Duplicate Prevention:** A Boy cannot send a new request to a Girl if one is already `PENDING` or an `ACTIVE` chat exists.

## 5. Chat Rules

### Chat Lifecycle & Billing
- **Purpose:** Manage real-time interactions and fair billing.
- **Trigger:** Chat Request accepted.
- **Expected Behavior:**
  - Socket rooms are joined.
  - A cron/socket-tick starts tracking duration.
  - For every 60 continuous seconds, 10 coins are debited from the Boy and credited to the Girl (minus commission).
  - Multiple simultaneous chats are allowed, but the wallet must sustain all active deducts.
- **Automatic Termination:** If a Boy's balance drops below 10 coins, all active chats are gracefully terminated by the server. Users receive a "Low Balance" system message.
- **Background Behavior:** Chats remain active and billing continues even if the app is backgrounded, until manually ended or balance is exhausted.

## 6. Messaging Rules

### Content & Moderation
- **Purpose:** Enforce platform safety and prevent revenue circumvention.
- **Expected Behavior:**
  - Supported: Text and Emojis.
  - Unsupported: Images, Audio, Video, Files.
  - **Moderation Pipeline:** Before a message is saved or broadcasted, a Regex/AI filter scans for Phone Numbers, URLs, Email, UPI, and Social Media handles.
  - **Blocked Message:** If flagged, the message is dropped. It is NEVER stored in the database. The sender receives an immediate warning prompt. The receiver sees nothing.

## 7. Rating & Favorite Rules

### Feedback & Discovery
- **Rating:** A Boy can rate a Girl (1-5 stars) only once per unique Chat session. Updating a rating overwrites the previous one. Ratings dynamically adjust the Girl's public average.
- **Favorites:** A Boy can favorite a Girl for quick access. This is a toggle (Add/Remove). Duplicate favorite entries are structurally prevented at the database level.

## 8. Report Rules

### Moderation Queue
- **Purpose:** Allow user-driven moderation.
- **Expected Behavior:** 
  - Any user can report another user during or after a chat.
  - Valid reasons: Harassment, Spam, Scam, Inappropriate Behavior.
  - Reports enter the Admin Queue as `PENDING`.
  - Admins review, resolve (`RESOLVED`), or dismiss (`REJECTED`). Admins can read chat logs associated with the report.

## 9. Withdrawal Rules

### Payout Lifecycle
- **Purpose:** Allow Girls to cash out earnings securely.
- **Eligibility:** Girl must exceed the `MinimumWithdrawalAmount` (configured in Platform Settings) and have no active bans.
- **Expected Behavior:**
  - Girl requests withdrawal. Amount is frozen/deducted from her available balance. Status = `PENDING`.
  - Admin manually processes the UPI transfer outside the system.
  - Admin marks as `COMPLETED` (or `FAILED` if UPI fails, refunding the balance).

## 10. Admin & Platform Rules

### Platform Configuration
- **Purpose:** Maintain dynamic control over the economy.
- **Expected Behavior:**
  - Values like Commission %, Minimum Withdrawal, and Maintenance Mode are strictly managed via a `PlatformSettings` singleton.
  - **Commission Changes:** If commission is updated, the new rate applies *only* to new chats. Active chats continue on the rate established at their `StartTime`.

---

## 11. Edge Cases & Exceptional Conditions

### Disconnections & Backgrounding
- **Boy/Girl Closes App:** Chat remains `ACTIVE`. Billing continues. The offline user receives push notifications for new messages. The chat only ends if explicitly terminated by a user, or if coins run out.
- **Internet Disconnect:** The socket drops, but the server maintains the chat state. When the user reconnects, they sync missed messages. If disconnected for > 5 minutes without returning, the server may auto-terminate the chat to protect the Boy's balance.

### Financial Edge Cases
- **Payment Succeeds but Callback Delayed:** Razorpay webhook acts as the source of truth. If delayed, the balance updates when the webhook arrives. Webhooks must be idempotent (duplicate callbacks are ignored based on transaction ID).
- **Simultaneous Withdrawals:** Database locks (optimistic concurrency) prevent a Girl from withdrawing more than her balance by submitting two requests at the exact same millisecond.
- **Coins Become Zero During a Message:** If a message is typed right as the 60-second tick triggers and balance hits zero, the server terminates the chat and rejects the message delivery with a "Chat Ended" error.
- **Simultaneous Chat Deductions (Race Condition):** If a Boy is in 3 chats with 25 coins left, the server tick must process deductions atomically. It will deduct for 2 chats (20 coins), realize balance is 5, and immediately terminate all 3 chats.

### Moderation Edge Cases
- **Admin Bans User During Active Chat:** Socket connections are immediately severed. The chat is forcefully ended. Billing stops at the exact second of the ban. No pending minute is billed.
- **Admin Rejects a Verified Girl:** If an Admin revokes approval, active chats are terminated, and her profile is instantly hidden from discovery. Balance remains intact for withdrawal unless confiscated by Admin.
- **Blocked Message Logic:** If a Boy tries to send his phone number, the server intercepts it. The Boy receives a local UI error ("Sharing contact info is prohibited"). The Girl is completely unaware the attempt occurred.

---
*These rules are designed to protect the platform's revenue, ensure user safety, and provide clear directives for backend and frontend implementation.*
