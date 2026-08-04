# Real-Time Architecture: Socket.IO Specification

This document defines the complete real-time communication architecture for the ChatVerse platform using Socket.IO. It serves as the definitive specification for backend and frontend developers to implement seamless, secure, and scalable real-time interactions.

---

## 1. Real-Time Architecture Overview

The platform relies heavily on Socket.IO for real-time presence, chat negotiation, messaging, and instantaneous wallet updates.

- **Protocol:** WebSockets (polling fallback enabled but discouraged).
- **Authentication:** JWT validated during the initial handshake.
- **Delivery Guarantees:** At-least-once delivery with explicit application-level Acknowledgements (ACKs) for critical events (like messages).

---

## 2. Connection Lifecycle & Authentication Flow

### Authentication Flow

1. **Client Connection:** Client initiates a connection passing the JWT in `auth: { token: "..." }`.
2. **JWT Validation:** Server middleware intercepts the handshake, decodes, and verifies the JWT.
3. **User Identification & Role Validation:** Server checks if the user is active, not banned, and resolves their Role (Boy, Girl, Admin).
4. **Socket Registration:** The `socket.user` object is populated with `userId`, `role`, and `status`.
5. **Join Personal Room:** The socket automatically joins a unique room named `user:<userId>`.
6. **Ready:** The server emits `system:ready` to the client.

### Disconnection & Reconnection

- **Temporary Disconnect:** The socket drops. The server flags the user as offline after a short grace period (e.g., 10 seconds) to prevent UI flickering.
- **Automatic Reconnection:** The Socket.IO client automatically attempts reconnection with exponential backoff. Upon reconnect, the auth flow repeats.

---

## 3. Room Strategy

Rooms are used to target events efficiently without broadcasting to the entire server.

- **Personal Rooms (`user:<userId>`):** Every authenticated user joins this room immediately. Used for direct, cross-device targeted events (e.g., Wallet updates, Notifications).
- **Chat Rooms (`chat:<chatId>`):** Created when a Chat Request is ACCEPTED. Both the Boy and Girl join this room. All chat messages and typing indicators are broadcasted to this room. When the chat ends, both users leave the room.
- **Admin Rooms (`admin:all`):** Joined by all Admin sockets for global moderation alerts.

---

## 4. Event Naming Convention

Events must follow a strict `<domain>:<action>` format.

- `chat:request`
- `message:send`
- `wallet:update`
- `error:unauthorized`

---

## 5. Event Catalogue

### 5.1 Presence System

- **`presence:online`**
  - **Emitter:** Server (upon connection).
  - **Receiver:** Clients (Boy's favorite list, etc.).
  - **Payload:** `{ userId: string, timestamp: ISOString }`
- **`presence:offline`**
  - **Emitter:** Server (upon disconnect + grace period).
  - **Receiver:** Clients.
  - **Payload:** `{ userId: string, lastSeen: ISOString }`
- **`presence:typing` / `presence:stop_typing`**
  - **Emitter:** Client.
  - **Receiver:** Server -> broadcast to `chat:<chatId>`.
  - **Payload:** `{ chatId: string, userId: string }`

### 5.2 Chat Request Events

- **`chat_request:send`**
  - **Purpose:** Boy requests a chat.
  - **Emitter:** Boy Client.
  - **Receiver:** Server -> Girl Client (via `user:<girlId>`).
  - **Payload:** `{ targetId: string }`
  - **ACK:** `{ success: boolean, requestId: string, error?: string }`
  - **Failures:** Insufficient coins, Girl offline, Girl already in max chats.
- **`chat_request:receive`**
  - **Emitter:** Server.
  - **Receiver:** Girl Client.
  - **Payload:** `{ requestId: string, boyId: string, boyName: string, avatar: string }`
- **`chat_request:accept` / `chat_request:reject`**
  - **Emitter:** Girl Client.
  - **Receiver:** Server -> Boy Client.
  - **Payload:** `{ requestId: string }`
  - **ACK:** `{ success: boolean, chatId?: string }`
- **`chat_request:expired` / `chat_request:cancelled`**
  - **Emitter:** Server (Cron) / Boy Client.
  - **Receiver:** Both Clients.
  - **Payload:** `{ requestId: string, reason: string }`

### 5.3 Chat Lifecycle Events

- **`chat:started`**
  - **Emitter:** Server.
  - **Receiver:** Both Clients (joining `chat:<chatId>`).
  - **Payload:** `{ chatId: string, startTime: ISOString, participants: [...] }`
- **`chat:ended`**
  - **Emitter:** Server (Time out, zero coins) or Client (Manual end).
  - **Receiver:** Both Clients.
  - **Payload:** `{ chatId: string, reason: "INSUFFICIENT_FUNDS" | "MANUAL" | "BANNED", duration: number, finalCost: number }`

### 5.4 Messaging Events

- **`message:send`**
  - **Purpose:** Send text/emoji to the active chat.
  - **Emitter:** Client.
  - **Receiver:** Server.
  - **Payload:** `{ chatId: string, tempId: string, content: string }`
  - **ACK:** Server responds with `{ success: true, messageId: string, timestamp: string }`. If `false`, includes error. Client uses `tempId` to reconcile local UI.
- **`message:receive`**
  - **Emitter:** Server (after DB save & moderation).
  - **Receiver:** Client (Recipient in `chat:<chatId>`).
  - **Payload:** `{ messageId: string, chatId: string, senderId: string, content: string, timestamp: string }`
- **`message:read`**
  - **Emitter:** Client (When message enters viewport).
  - **Receiver:** Server -> Sender Client.
  - **Payload:** `{ chatId: string, messageIds: string[] }`

### 5.5 Wallet Events

- **`wallet:update`**
  - **Emitter:** Server (Triggered by Recharges or Chat deductions).
  - **Receiver:** Boy/Girl Client (via `user:<userId>`).
  - **Payload:** `{ newBalance: number, delta: number, reason: string }`
- **`wallet:low_balance`**
  - **Emitter:** Server.
  - **Receiver:** Boy Client.
  - **Payload:** `{ currentBalance: number, estimatedMinutesLeft: number }`

### 5.6 Notification & Admin Events

- **`notification:new`**
  - **Emitter:** Server.
  - **Receiver:** Client (`user:<userId>`).
  - **Payload:** `{ id: string, type: string, title: string, body: string, actionUrl: string }`
- **`admin:moderation_alert`**
  - **Emitter:** Server (When a blocked message or high-risk behavior occurs).
  - **Receiver:** Admin Clients (`admin:all`).
  - **Payload:** `{ type: "BLOCKED_MESSAGE", userId: string, content: string }`
- **`user:force_disconnect`**
  - **Emitter:** Server (When Admin bans a user).
  - **Receiver:** Target Client.
  - **Payload:** `{ reason: "BANNED" }`

### 5.7 Error Events

- **`error:exception`**
  - **Emitter:** Server.
  - **Receiver:** Client.
  - **Payload:** `{ code: "INSUFFICIENT_COINS" | "UNAUTHORIZED" | "BLOCKED_CONTENT", message: string }`

---

## 6. Reliability & Delivery Guarantees

- **Acknowledgements (ACKs):** Critical events (`message:send`, `chat_request:send`) MUST use Socket.IO acknowledgements. The client UI should show a "pending/clock" icon until the ACK returns.
- **Idempotency:** Clients must generate a `tempId` (UUID) for messages. If a network drop causes a retry, the server ignores duplicate `tempId`s to prevent double-sending.
- **Offline Messages:** If a user is disconnected, messages are saved in the DB. Upon reconnect, the client must REST API fetch `/api/chats/:id/messages?after=lastMessageTimestamp` to reconcile missed messages before relying on socket streams.

---

## 7. Performance & Scalability

- **Redis Adapter:** The architecture is designed to support `@socket.io/redis-adapter` from Day 1. This allows the backend to scale horizontally across multiple Node.js instances while ensuring cross-node room broadcasts work perfectly.
- **Memory Optimization:** Avoid storing large arrays of connected users in Node.js memory. Rely on Redis presence keys (`SETEX`) to track online status.
- **Heartbeat:** `pingInterval: 25000` and `pingTimeout: 20000` are recommended to keep mobile connections alive without draining battery.

---

## 8. Security

- **JWT Validation on Handshake:** Connections without valid tokens are immediately dropped.
- **Room Access Control:** Users cannot arbitrarily join rooms. The server strictly controls room membership (e.g., joining `chat:<chatId>` requires a DB lookup to ensure the user is a participant).
- **Message Validation:** Every `message:send` payload undergoes strict regex/AI moderation. Blocked content triggers an `error:exception` and is dropped.

---

## 9. Future Expansion

This architecture guarantees that future features require zero redesigns:

- **Media Messages:** Simply add `type: "image"` to `message:send` and pass a pre-signed S3 URL.
- **Voice/Video Calls:** WebRTC signaling (Offer/Answer/ICE candidates) can easily be routed through the existing `chat:<chatId>` rooms using new event namespaces (e.g., `webrtc:offer`).
- **Group Chats:** The Room strategy inherently supports N-participants without modification.
