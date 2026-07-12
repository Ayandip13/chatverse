# Database Architecture: ChatVerse

This document defines the core database architecture for the ChatVerse platform. It serves as the definitive reference for how data is structured, stored, and managed using MongoDB and Mongoose ODM.

---

## 1. Database Overview & Design Philosophy
**Database:** MongoDB
**ODM:** Mongoose

Our database design strictly prioritizes:
- **Scalability & Performance:** Optimized for high-frequency reads (user discovery) and writes (chat messages, real-time wallet deductions).
- **Maintainability:** Clear boundaries, strict validation, and centralized configuration.
- **Data Integrity:** Preventing race conditions in wallet deductions and concurrent chats.
- **Future Extensibility:** Schemas designed to seamlessly adopt future features like media attachments, subscriptions, and calls without major migrations.

We avoid unnecessary complexity. Soft deletes are used strategically where historical data must be preserved (e.g., Users, Chats) and hard deletes for transient or revocable data (e.g., Favorites).

---

## 2. Collections Overview

### 2.1 Users
- **Purpose:** Stores core identity for both Boys (Consumers) and Girls (Service Providers).
- **Business Responsibility:** Authentication, profile discovery, and account status management.
- **Relationships:** 1:1 with Wallet; 1:N with ChatRequests, Chats, Ratings, Favorites, and Reports.
- **Important Fields:** `email`, `role` (boy/girl), `status`, `authProvider`, profile details.
- **Indexes:** Unique index on `email`. Geospatial/Text index on profile fields if discovery logic expands.

### 2.2 Admins
- **Purpose:** Segregated from `Users` for absolute security.
- **Business Responsibility:** Platform moderation, configuration, and withdrawal processing.
- **Relationships:** Modifies Users, PlatformSettings, and resolves Reports.

### 2.3 Wallets
- **Purpose:** Centralized ledger state for user balances.
- **Business Responsibility:** Maintains real-time coin balances, lifetime earnings, and spend logic.
- **Relationships:** 1:1 with Users. 1:N with WalletTransactions.

### 2.4 WalletTransactions
- **Purpose:** Immutable append-only log of every financial movement.
- **Business Responsibility:** Auditing, refund processing, and financial integrity.
- **Relationships:** Belongs to a Wallet. References entities like Chat or WithdrawRequest if applicable.

### 2.5 ChatRequests
- **Purpose:** Manages the handshake between a boy and a girl before a chat session begins.
- **Business Responsibility:** Prevents spam, handles rate-limiting, and tracks acceptance/rejection metrics.
- **Relationships:** Belongs to Sender (Boy) and Receiver (Girl). Evolves into a `Chat` upon acceptance.

### 2.6 Chats
- **Purpose:** Represents an active or historical chat session.
- **Business Responsibility:** Tracks duration, coin consumption, and participant metadata.
- **Relationships:** References Boy, Girl, and the originating ChatRequest. Parent to `Messages`.

### 2.7 Messages
- **Purpose:** Stores the actual textual conversation.
- **Business Responsibility:** Only stores validated, unblocked text/emojis.
- **Relationships:** Belongs to a Chat. References Sender.

### 2.8 Notifications
- **Purpose:** Asynchronous system alerts for users.
- **Business Responsibility:** Delivering critical status updates (e.g., low balance, withdrawal approved).
- **Relationships:** Belongs to a User.

### 2.9 Reports
- **Purpose:** Tracks user-generated moderation alerts.
- **Business Responsibility:** Maintains the queue for Admin review and stores resolution evidence.
- **Relationships:** References Reporter, Reported User, and the resolving Admin.

### 2.10 WithdrawRequests
- **Purpose:** Manages payout lifecycles for Girls.
- **Business Responsibility:** Tracks requested amounts, UPI details, and Admin payout processing.
- **Relationships:** Belongs to a User (Girl).

### 2.11 Ratings
- **Purpose:** Stores feedback post-chat.
- **Business Responsibility:** Calculates the Girl's public reputation.
- **Relationships:** References Chat, Reviewer (Boy), and Target (Girl).

### 2.12 Favorites
- **Purpose:** Quick access for Boys to bookmark Girls.
- **Business Responsibility:** Discovery and engagement retention.
- **Relationships:** Composite unique index on Boy and Girl.

### 2.13 PlatformSettings
- **Purpose:** Global singleton collection for dynamic configuration.
- **Business Responsibility:** Ensures platform variables (commission, limits) are configurable without code deployments.

---

## 3. Relationships Summary
- `User` ⭢ `Wallet` (1:1)
- `Wallet` ⭢ `WalletTransactions` (1:N)
- `ChatRequest` ⭢ `Chat` (1:1 upon acceptance)
- `Chat` ⭢ `Messages` (1:N)
- `Girl` ⭢ `Ratings` (1:N, averaged for profile display)
- `Boy` ⭢ `Favorites` (1:N)
- `Report` ⭢ `User` (N:1)

---

## 4. Status Enums
Strict string enums must be enforced at the schema level.

- **Girl Status:** `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `BANNED`
- **Boy Status:** `ACTIVE`, `SUSPENDED`, `BANNED`
- **Chat Request Status:** `PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `CANCELLED`
- **Chat Status:** `ACTIVE`, `ENDED`
- **Withdraw Status:** `PENDING`, `PROCESSING`, `APPROVED`, `REJECTED`, `COMPLETED`, `FAILED`
- **Notification Status:** `UNREAD`, `READ`, `ARCHIVED`
- **Report Status:** `PENDING`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`
- **Rating Status:** `ACTIVE`, `HIDDEN`, `DELETED`

---

## 5. Wallet Architecture
### 5.1 Balance Strategy
**Hybrid Approach Recommended:** The `Wallet` document stores computed balances (Current Balance, Lifetime Recharge, Lifetime Earnings, Lifetime Spent) for fast O(1) reads. However, this computed state MUST strictly mirror the sum of the immutable `WalletTransactions` log. 
If a discrepancy occurs, the transaction log is the absolute source of truth and can reconstruct the wallet balance.

### 5.2 Wallet Transactions
Every movement of value requires a discrete transaction log.
- **Types:** `RECHARGE`, `CHAT_DEBIT`, `GIRL_EARNING`, `WITHDRAWAL`, `ADMIN_ADJUSTMENT`, `REFUND`, `BONUS`.
- **Why:** Absolute auditability. Financial disputes and bug tracking require a perfect, immutable ledger.

---

## 6. Coin System & Chat Architecture
### 6.1 Coin Policy
- ₹1 INR = 1 Coin.
- 100 Coins = 10 Minutes (10 Coins/Minute).
- Billing initiates *only* after `ChatRequest` transitions to `ACCEPTED`.
- Deductions occur for **completed minutes only** (e.g., 3m 40s = 3 minutes charged).
- If multiple chats run concurrently, deduct logic must lock the wallet, assess if balance suffices for *all* active chats, and gracefully emit termination events if insufficient.

### 6.2 Chat Lifecycle
1. **Creation:** Boy sends Request (locks minimal coin buffer if required).
2. **Acceptance:** Girl accepts. `Chat` is created. `StartTime` is stamped.
3. **Consumption:** Cron jobs or WebSocket ticks process per-minute deductions, splitting the 10 coins between Girl Earnings and Platform Commission.
4. **Termination:** Ends via user action or system trigger (insufficient funds). `EndTime` is stamped, total duration is calculated.

---

## 7. Message Architecture & Moderation
- **Storage:** Text and Emojis only.
- **Moderation Pipeline:** 
  1. Socket receives message.
  2. Middleware runs Regex/AI detection for Phone, Email, UPI, Socials, URLs.
  3. If flagged: Socket drops message, alerts sender. Message is **NEVER** stored in the database.
  4. If clean: Persisted to DB and broadcasted.
- **Why avoid storing blocked messages?** Reduces liability, database bloat, and completely neutralizes off-platform solicitation attempts.

---

## 8. Ratings & Favorites
- **Ratings:** A Boy can rate a Girl only once per unique `Chat`. 
  - **Best Approach:** Cache the `averageRating` and `totalRatings` on the `User` (Girl) document. Update these values incrementally on every new rating to avoid expensive aggregate queries on discovery screens.
- **Favorites:** Use a unique compound index `{ boyId: 1, girlId: 1 }` to prevent duplicates. Hard delete the record when unfavorited.

---

## 9. Notification & Report Architecture
- **Notifications:** Stored with a TTL (Time-To-Live) index to auto-delete after 30/60 days. Delivery relies on active socket connections, falling back to database persistence for unread states. Future integration with FCM/APNs for push notifications is inherently supported by this model.
- **Reports:** Contains the Reporter ID, Target ID, Reason Enum, text notes, and resolution status. Can attach specific Chat IDs or Message IDs as reference evidence.

---

## 10. Platform Settings
Centralized document (Singleton) containing:
- `commissionPercentage`
- `minimumWithdrawalAmount`
- `maximumRechargeAmount`
- `isMaintenanceMode`
**Why?** Hardcoding business logic forces app updates and backend re-deployments. A settings collection allows Admins to tune the economy dynamically.

---

## 11. Engineering Recommendations & Data Integrity

### 11.1 Index Strategy
- **Users:** `{ email: 1 }` (Unique), `{ role: 1, status: 1 }` (For listing/discovery).
- **WalletTransactions:** `{ walletId: 1, createdAt: -1 }` (For fast ledger queries).
- **Chats:** `{ boyId: 1, status: 1 }`, `{ girlId: 1, status: 1 }` (For active chat lookups).
- **Messages:** `{ chatId: 1, createdAt: 1 }` (For retrieving chat history sequentially).
- **Favorites:** `{ boyId: 1, girlId: 1 }` (Unique).

### 11.2 Timestamps & Soft Deletes
- Enable Mongoose `{ timestamps: true }` (`createdAt`, `updatedAt`) on every collection.
- **Soft Deletes (`deletedAt`):** Use for `Users` and `Chats`. We never truly delete a user; we soft-delete them to preserve transaction history and chat logs for compliance. Hard deletes are fine for `Favorites` or read `Notifications`.

### 11.3 Data Integrity (Race Conditions)
- **Concurrent Deductions:** When deducting coins across multiple chats, utilize MongoDB's atomic `$inc` operators or find-and-modify with optimistic concurrency control (version keys `__v`). Never read balance into memory, subtract, and save, as this causes lost updates.

### 11.4 Security Considerations
- **Passwords:** Hashed via `bcrypt` (Salt Rounds 10+). Never returned in API responses.
- **UPI & PII:** Encrypt sensitive financial details at rest if possible, or strictly gate access at the API layer.
- **Tokens:** JWTs are stateless; handle revocation by tracking blacklisted tokens or changing a `tokenVersion` on the User document on major security events.

---

## 12. Future Expansion Readiness
The database is inherently structured for vertical scaling:
- **Media/Calls:** `Messages` collection can simply add `messageType` and `mediaUrl`.
- **Subscriptions:** `Wallets` can easily accommodate `subscriptionExpiry` fields.
- **Coupons/Referrals:** Dedicated collections can easily map to `Users` and inject into `WalletTransactions` as a `BONUS` type.
- **Analytics:** The immutable `WalletTransactions` and `Chats` data structures are perfect for ETL pipelines into data warehouses.
