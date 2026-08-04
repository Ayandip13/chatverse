# Project Brief: ChatVerse

## Executive Summary

This document serves as the single source of truth for the ChatVerse platform, a real-time paid text chatting application. The ecosystem consists of three interconnected applications: a Node.js Backend, a React Admin Panel, and a React Native (Expo) Mobile App for both Boys and Girls. The platform facilitates paid text conversations where male users purchase and spend coins to chat with female users, who in turn earn real money from these interactions. The platform retains a configurable commission from these transactions.

## Product Vision

To build an elegant, fast, and highly reliable paid real-time text chatting platform that provides a premium experience for its users while offering a viable income stream for verified female participants, supported by a scalable, maintainable, and type-safe architecture.

## Product Objectives

- Deliver a smooth, slightly playful, yet premium messaging experience.
- Implement a robust financial ecosystem driven by a real-time coin deduction and earning mechanism.
- Guarantee security and moderation by automatically filtering prohibited content.
- Support real-time interactions globally, even when apps are backgrounded.
- Ensure type-safe and consistent communication between mobile clients, admin portal, and backend services.

## Business Goals

- Establish a sustainable revenue model through configurable chat commission rates.
- Ensure high user engagement through reliable notification and background-chat delivery.
- Provide a secure platform with zero tolerance for off-platform solicitation (e.g., sharing phone numbers, social media).
- Build a foundation for a rapidly scalable user base and international market expansion.

## Target Users

### 1. Boys (Consumers)

- Users seeking real-time text conversations.
- Willing to purchase digital currency (coins) to interact with female users.

### 2. Girls (Service Providers)

- Verified female users looking to monetize their time through text chatting.
- Require secure and prompt payouts via UPI.

### 3. Administrators

- Platform operators responsible for user moderation, account verification (Girls), payout processing, and configuring platform fees.

## User Journey

### Boy User Journey

1. **Onboarding:** Registers/Logs in via Email + Password or Google Login.
2. **Wallet Top-up:** Purchases coins via Razorpay Web Checkout.
3. **Discovery:** Browses and searches for available girls.
4. **Engagement:** Sends a chat request to a selected girl.
5. **Chatting:** Upon acceptance, chats in real-time. Coins are deducted for every completed minute. Chat ends automatically if coins are insufficient.
6. **Post-Chat:** Rates, favorites, or reports the girl. Views wallet and transaction history.

### Girl User Journey

1. **Onboarding:** Registers via Email + Password or Google Login.
2. **Verification:** Enters a pending state. Receives a manual phone call from Admin for identity verification. Once approved, the account becomes active.
3. **Engagement:** Receives and accepts (or rejects) incoming chat requests.
4. **Chatting:** Engages in text conversation, earning a portion of the spent coins.
5. **Withdrawal:** Accumulates earnings and submits a withdrawal request.
6. **Post-Chat:** Manages profile, views earnings, and reports boys if necessary.

## Core Features

- **Paid Real-Time Chat:** Coin-based chatting with per-minute deduction (deducts only for completed minutes).
- **Wallet & Transactions:** Coin purchasing via Razorpay and earning tracking.
- **Verification System:** Manual Admin verification and approval for female users.
- **Automated Moderation:** Real-time filtering of contact information and external links.
- **Robust Notifications:** Comprehensive event-driven notifications for all user roles.
- **Background Support:** Continuous chat sessions even when the app is backgrounded.

## Functional Requirements

### Authentication

- Email + Password and Google Login for both Boys and Girls applications.

### Chat & Messaging

- Supported media: Text and Emojis only.
- Not supported: Images, Audio, Video, Voice Notes, Files, Stickers.
- Coins are deducted only for completed minutes (e.g., 3m 40s = 3m charged).
- Billing starts only after the girl accepts the chat request.
- Chat terminates automatically upon insufficient coins.
- Support for multiple simultaneous chats.

### Payments & Finances

- **Recharge:** Razorpay Web Checkout for boys.
- **Commission:** Platform commission percentage must be configurable from the Admin Panel.
- **Withdrawals:** Girls request withdrawals; Admin processes them manually via UPI transfers.

### Moderation

- Backend must detect and automatically block messages containing:
  - Phone Numbers
  - WhatsApp, Telegram, Instagram, Facebook links/handles
  - Email Addresses
  - URLs
  - UPI IDs
- Blocked messages must never reach the recipient.

### Notifications

- **Boy:** Chat Accepted, Chat Rejected, Coins Low, Recharge Success, Recharge Failed, Chat Ended, Account Warning, Account Suspended.
- **Girl:** New Chat Request, Withdrawal Approved, Withdrawal Rejected, Account Approved, Account Rejected, Account Suspended.
- **Admin:** New Girl Registration, New Withdrawal Request, New User Reports.

## Non-Functional Requirements

- **Performance:** Fast real-time messaging with minimal latency using Socket.IO.
- **Scalability:** Architecture must support multiple simultaneous chats and a growing user base without degradation.
- **Internationalization (i18n):** Initial release in English. Architecture must support dynamic localization (future Hindi/Bengali). No user-facing text should be hardcoded to UI components.
- **Design Aesthetic:** Premium, elegant, modern, smooth, fast, and slightly playful. Unique visual identity, avoiding direct clones of existing apps.

## Technical Stack

### Mobile Apps (Boys & Girls)

- React Native
- Expo
- TypeScript

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT Authentication

### Admin Panel

- React
- Vite
- TailwindCSS
- TypeScript

## Risks

- **Real-Time Consistency:** Managing accurate per-minute coin deductions in a distributed real-time environment, especially with backgrounded applications.
- **Content Moderation:** Evasion of regex/text filters by users trying to share contact info (e.g., "my insta is user dot name").
- **App Store Compliance:** Adhering to Apple/Google guidelines regarding paid digital services and NSFW content moderation.
- **Manual Verification Bottleneck:** Scaling the manual phone verification process for girls as the platform grows.

## Assumptions

- ₹1 INR equals 1 Coin.
- 100 Coins equal 10 Minutes of chat time.
- Admins have access to the necessary phone infrastructure to verify girls manually.
- Manual UPI transfers will remain feasible for initial scale before automated payouts are required.

## Future Roadmap

- Referral System
- Coupons
- Multi-language Support (Hindi, Bengali)
- Analytics Dashboard
- Advanced AI-based Moderation
- Additional Payment Methods
- Rich Notifications (Push images/actions)

## Engineering Principles

- **Scalability:** Design databases and socket events to handle high concurrency.
- **Maintainability:** Write self-documenting code with clear boundaries.
- **Clean Architecture:** Ensure clear separation of business logic, data access, and transport layers.
- **Reusable Components:** Build a shared UI component library within the Expo applications.
- **Separation of Concerns:** Keep routing, state management, and API calls isolated.
- **Type Safety:** Strict TypeScript implementation across all repositories. Shared types between Backend and Frontend where possible.
- **Production Readiness:** Implement robust error handling, logging, and environment configurations from day one.
- **Developer Experience:** Streamlined local setup, consistent linting/formatting, and clear documentation.
- **Consistent Naming Conventions:** Adopt standard casing (e.g., camelCase for variables, PascalCase for components) and predictable file structures.
