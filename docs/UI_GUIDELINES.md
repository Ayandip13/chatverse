# UI Guidelines: Design System & UX Principles

This document serves as the official Design System and UI/UX framework for the ChatVerse platform. It governs all interfaces across the Boys Mobile App, Girls Mobile App, and the Admin Panel. Adherence to these rules ensures a visually consistent, premium, and highly accessible user experience.

---

## 1. Design Philosophy & UX Principles
- **Vibe:** Premium, Modern, Elegant, Smooth, Minimal, Professional, Trustworthy, Slightly Playful.
- **Identity:** A unique aesthetic that takes cues from top-tier dating apps but establishes its own recognizable visual language (avoiding direct clones).
- **UX Priorities:** Speed, Clarity, Consistency, Minimalism, Trust.
- **Friction Reduction:** Navigation must be instant; transactions must feel secure and effortless. Smooth micro-interactions should delight the user without causing delays.

---

## 2. Theming & Design Tokens
All UI components must support **Light** and **Dark** themes.
- **NEVER** hardcode colors inside components (e.g., `color: '#FFFFFF'`).
- Always use **Design Tokens** (e.g., `theme.colors.background`, `text-primary`, `bg-surface`).
- Organize tokens strictly for: Colors, Typography, Spacing, Radius, Shadows, Animation Durations, and Z-Index.

---

## 3. Color Palette
Colors must be referenced via theme tokens. Below are the foundational HEX values (Base/Light Mode references; adjust luminosity for Dark Mode).

### 3.1 Brand & Core
- **Primary:** `#6366F1` (Indigo) — Used for primary actions, active tabs, main buttons, and brand identity.
- **Secondary:** `#EC4899` (Pink) — Used for playful accents, special features (like favorites), and secondary CTAs.
- **Accent:** `#8B5CF6` (Purple) — Used sparingly for premium features or gradients with Primary.

### 3.2 Semantic & State Colors
- **Success:** `#10B981` (Emerald) — Successful actions, approved statuses.
- **Warning:** `#F59E0B` (Amber) — Low balance, pending statuses.
- **Danger:** `#EF4444` (Red) — Destructive actions, errors, rejected statuses, ban actions.
- **Info:** `#3B82F6` (Blue) — Informational toasts, neutral alerts.

### 3.3 Structural Colors
- **Background:** Light: `#F8FAFC` | Dark: `#0F172A` — App and page backgrounds.
- **Surface:** Light: `#FFFFFF` | Dark: `#1E293B` — Headers, bottom tabs, standard surfaces.
- **Card:** Light: `#FFFFFF` | Dark: `#1E293B` — Used for content blocks (slightly elevated in light mode).
- **Border:** Light: `#E2E8F0` | Dark: `#334155` — Input borders, card borders.
- **Divider:** Light: `#F1F5F9` | Dark: `#1E293B` — Subtle lists/section separators.

### 3.4 Typography Colors
- **Text Primary:** Light: `#0F172A` | Dark: `#F8FAFC` — Headings, main body text.
- **Text Secondary:** Light: `#475569` | Dark: `#94A3B8` — Subtitles, captions, timestamps.
- **Text Muted:** Light: `#94A3B8` | Dark: `#64748B` — Disabled text, very low emphasis.
- **Placeholder:** Light: `#CBD5E1` | Dark: `#475569` — Input placeholders.

### 3.5 Specific Use Cases
- **Online Status:** `#22C55E` (Green) | **Offline Status:** `#94A3B8` (Gray).
- **Admin Verification:** Pending (`#F59E0B`), Approved (`#10B981`), Rejected (`#EF4444`).
- **Chat Bubble (Sender):** Primary gradient or solid `#6366F1` (White text).
- **Chat Bubble (Receiver):** Surface color (Light: `#F1F5F9`, Dark: `#334155`) (Primary text).
- **Wallet & Revenue:** Deep Green `#059669` or Gold `#F59E0B` for premium/coin emphasis. Admin dashboards use Primary/Accent for graphs.

---

## 4. Typography
**Font Family:** Use a modern, clean sans-serif (e.g., *Inter*, *Outfit*, or *SF Pro/Roboto* via system fonts).

### 4.1 Hierarchy & Sizing
- **Heading 1 (H1):** 32px | Weight: Bold (700) | LH: 40px — Screen titles (Admin).
- **Heading 2 (H2):** 24px | Weight: SemiBold (600) | LH: 32px — Section headers.
- **Heading 3 (H3):** 20px | Weight: SemiBold (600) | LH: 28px — Card titles, modals.
- **Body Large:** 16px | Weight: Regular (400) | LH: 24px — Main content, chat text.
- **Body Medium:** 14px | Weight: Regular (400) | LH: 20px — Secondary text, inputs.
- **Caption:** 12px | Weight: Medium (500) | LH: 16px — Timestamps, tags, badges.
- **Buttons:** 16px | Weight: SemiBold (600) | Letter Spacing: 0.5px.
- **Labels:** 14px | Weight: Medium (500) | Input labels.

### 4.2 Application
- **Chat Text:** 16px Regular. Must be highly legible.
- **Notification Text:** 14px Medium.
- **Error/Empty State Text:** 14px or 16px Regular, centered, using Text Secondary color.

---

## 5. Spacing System
Use a strict 4px grid system. Never use arbitrary numbers.
- **4px (xs):** Micro-spacing (between icon and text).
- **8px (sm):** Small items (input text to border, tight list items).
- **12px (md):** Medium spacing (inside buttons, cards).
- **16px (lg):** Standard padding (screen edges, standard gaps).
- **20px (xl):** Section spacing.
- **24px (2xl):** Large section spacing, modal padding.
- **32px (3xl):** Major component separation.
- **40px (4xl):** Empty state vertical margins.
- **48px (5xl) / 64px (6xl):** Hero sections, bottom padding for safe areas.

---

## 6. Border Radius
- **Small (4px):** Checkboxes, tags, small badges.
- **Medium (8px):** Buttons, inputs, dropdowns.
- **Large (16px):** Cards, modals, chat bubbles (Receiver).
- **XL (24px):** Bottom sheets, chat bubbles (Sender specific rounded corners).
- **Pill (9999px):** Status badges, floating action buttons, tags.
- **Full (50%):** Avatars, profile pictures.

---

## 7. Shadows (Elevations)
- **Level 1 (Card):** Subtle shadow for standard cards (e.g., `0 1px 3px rgba(0,0,0,0.1)`).
- **Level 2 (Buttons/Nav):** Slightly pronounced for primary buttons or sticky headers.
- **Level 3 (Dropdown/Floating):** Clear separation for dropdowns and FABs.
- **Level 4 (Modals/Bottom Sheets):** Deep shadow for overlay elements, always paired with a backdrop dimming layer (`rgba(0,0,0,0.5)`).

---

## 8. Icons
- **Library:** *Lucide Icons* (or Phosphor Icons) for consistent, modern stroke-based iconography.
- **Sizes:** 16px (small details), 20px (standard inline), 24px (navigation/actions), 32px (empty states).
- **Usage:**
  - **Outlined:** Default state for inactive tabs, standard actions.
  - **Filled:** Active tabs, toggled states (e.g., Favorited, Liked).

---

## 9. UI Components

### 9.1 Buttons
- **Primary:** Solid Primary background, White text.
- **Secondary:** Surface background, Primary border, Primary text.
- **Ghost:** Transparent background, Primary text (for less prominent actions).
- **Danger:** Solid Danger background.
- **States:** Hover (Admin), Active/Pressed (Mobile - slight opacity drop), Disabled (Muted bg, Disabled text, no interaction).
- **Loading:** Replace text with a spinner matching the text color; disable interaction.

### 9.2 Inputs
- **Base Style:** 16px text (prevents iOS zoom), 12px padding, Medium border radius.
- **States:** 
  - *Default:* Border color.
  - *Focus:* Primary border color + subtle ring (Admin).
  - *Error:* Danger border + Danger caption text below.
  - *Disabled:* Muted background, non-interactive.
- **Types:** Support clear icons, password reveal toggles, and prefixed icons (e.g., Search).

### 9.3 Cards
Cards must have a Surface background, Border (optional in Light mode), and Large radius.
- **Girl Card (Discovery):** Image heavy, gradient overlay at bottom for name/status, Pill-shaped online indicator.
- **Transaction Card:** Clean row, icon on left, details middle, amount on right (+Green/-Text Primary).

### 9.4 Lists
- **Spacing:** 16px padding inside rows, 1px Divider between (or 8px gap if using cards).
- **States:** Always include Skeleton loading states (not spinners) and playful Empty States with an illustration/icon.

---

## 10. Platform Specific Guidelines

### 10.1 Chat UI
- **Sender Bubble:** Right-aligned, Primary color, white text. Bottom-right radius is Small (4px), others Large (16px).
- **Receiver Bubble:** Left-aligned, Surface color, Primary text. Bottom-left radius is Small, others Large.
- **Meta:** Timestamps and Read Receipts (Tick icons) embedded at the bottom corner of bubbles.
- **System Messages:** Centered, Date Dividers (e.g., "Today"), Unread dividers (Red line with "New Messages").
- **Input Area:** Sticky to bottom, auto-expanding Textarea (up to 4 lines), Emoji toggle, circular Send button.

### 10.2 Wallet UI
- **Wallet Card:** Premium gradient background (Primary to Accent), large balance display, quick action buttons (Recharge/Withdraw).
- **History:** Clear, categorized list with distinct icons for deductions (Chat) and additions (Recharge/Earnings).

### 10.3 Admin Dashboard
- **Layout:** Fixed left sidebar (Dark mode preferred for sidebar), top navigation for user context/search, main content area with max-width.
- **Data:** Tables with sticky headers, pagination controls, status badges (Pill). Data-heavy charts (Recharts/Chart.js) using theme colors.

### 10.4 Navigation
- **Mobile:** Bottom Tabs for core sections (Home, Search, Chats, Profile). Stack for deep layers (Chat screen). Modals/Bottom Sheets for quick contextual actions (Filters).
- **Header:** Sticky headers with Blur/Glassmorphism effect, clean back buttons, centered titles.

---

## 11. Animations & Feedback
- **Duration:** 200ms (Fast, UI states) to 300ms (Screen transitions/Modals).
- **Types:**
  - Screen transitions: Slide from right (Mobile).
  - Modals: Fade in + Scale up slightly (95% -> 100%).
  - Bottom Sheets: Slide up.
  - Skeleton: Shimmer effect from left to right.
- **When NOT to animate:** Data-heavy tables, standard typing, rapid rapid-fire actions where animation slows down intent.
- **Feedback States:** Every action must have a visual response (Loading spinner on button, Toast for success/error, distinct Offline banner at screen top).

---

## 12. Accessibility & Responsiveness
- **Touch Targets:** Minimum 44x44px for all tappable elements on mobile.
- **Contrast:** Ensure 4.5:1 contrast ratio for all text against backgrounds.
- **Screen Readers:** Provide `accessibilityLabel` for icon-only buttons.
- **Responsive:** Mobile apps lock to portrait. Admin panel must adapt from 1024px (Tablet) to 1920px+ (Desktop) using CSS Grid/Flexbox.

---

## 13. Image Guidelines
- **Avatars:** Always Full radius (circle). Fallback to initials with a Primary gradient background if no image exists.
- **Profile Photos:** High quality, standardized aspect ratios (e.g., 4:5 for cards). Display subtle Skeleton while loading.

---

## 14. Component Philosophy
- **Reusable & Composable:** Build primitive components (Text, View, Button) and compose complex ones.
- **Predictable:** Props should be standard (e.g., `isLoading`, `isDisabled`, `variant="primary"`).
- **Theme-aware:** Components automatically switch styles based on the active theme context.
