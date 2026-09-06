# TJFLOW — Modern Real-Time Workspace & Project Management Platform

> **Repository Name**: `TJ-Tasks-2026-Shubhr-Gunjan`  
> **Author**: Shubhr Gunjan ([shubhrrgunjan@gmail.com](mailto:shubhrrgunjan@gmail.com))

---

## 🚀 Overview

**TJFLOW** is a modern, high-performance, real-time workspace and task management platform designed for modern product and software teams. Built using **React 18**, **Vite**, **TypeScript**, **TailwindCSS**, and **Firebase (Auth & Firestore)**, TJFLOW provides:

- **Real-Time Kanban Project Boards**: Drag-and-drop task status columns (`To Do`, `In Progress`, `Completed`) synchronized live across browsers.
- **Direct Messaging & Project Chat**: Channel-based and direct user messaging with real-time updates.
- **Synced Workspace Metrics & Activity Log**: Dynamic user profile statistics (assigned tasks, active tasks, completed work) and audited activity event streams.
- **Pseudo Payment Gateway**: Interactive Pro membership checkout modal featuring billing frequency toggles, live credit card preview widget, simulated transaction authorization, and instant profile upgrade.
- **Direct Google Authentication**: 1-click Google Sign-In and registration powered by Firebase OAuth 2.0 popup authorization.
- **Universal Default Light Mode + Cloud Theme Sync**: Universal Light Mode initial state with cloud persistence (`users/{uid}.themePreference`) across devices.
- **Vibrant Modern Bauhaus Design System**: Energetic geometric accents (`● ■ ▲`), top card color borders, tinted metric icon containers, and smooth cubic-bezier transitions.

---

## 💡 Approach and Algorithm

### 1. Real-Time Data Synchronization Engine
- **Problem**: Traditional polling causes latency and high API overhead. Direct root collection queries across multiple projects frequently fail due to Firestore indexing rules.
- **Algorithm & Approach**:
  1. Fetch all project IDs (`pids`) where the user is an owner or member using `getUserProjects(userId)`.
  2. Instantiate real-time Firestore listeners (`onSnapshot`) scoped to each project via `subscribeUserProjectTasks(pids, callback)`.
  3. Aggregate tasks in memory using a dictionary map `Record<string, Task[]>` to ensure zero duplicates and single-pass `O(N)` metric calculations for assigned, active, and completed task counts.
  4. Perform multi-query activity merging (`actorId == userId` + project activity streams), deduplicate logs by unique `id`, and sort descending by `createdAt` in memory.

### 2. Universal Light Mode & Cloud Persistence Algorithm
- **Problem**: Automatic dark mode triggers based on OS `prefers-color-scheme` disrupted user expectations, while theme toggles failed to persist when logging in from new devices.
- **Algorithm & Approach**:
  1. **Default State**: Initial state evaluates strictly to `'light'` if no stored key exists in `localStorage`, ignoring browser OS theme settings.
  2. **Cloud Sync**: When an authenticated user toggles their theme, `setTheme` updates `localStorage` **and** asynchronously dispatches `updateUserProfile(uid, { themePreference: newTheme })` to Firestore.
  3. **Reactive Restoration**: On initial login or profile load, `ThemeContext` detects `profile.themePreference` and automatically aligns the theme state. Multi-tab synchronization is maintained via `window.addEventListener('storage')`.

### 3. Pseudo Payment Gateway & Subscription State Machine
- **Problem**: Mocking a modern subscription flow requires simulating realistic card inputs, billing toggles, security checks, and backend database state updates.
- **Algorithm & Approach**:
  1. **State Machine**: The checkout modal transitions through discrete states: `FORM` → `PROCESSING` (Step 1: 256-bit encryption check → Step 2: Bank issuer authorization → Step 3: Membership activation) → `SUCCESS`.
  2. **Dynamic Card Preview**: As the user types, input sanitizers format card numbers (`4242 •••• •••• 4242`) and expiry dates (`MM/YY`), updating a live CSS gradient credit card widget in real time.
  3. **Database Upgrade**: Upon completion, the gateway triggers `updateUserProfile(uid, { isPro: true, subscriptionPlan: plan })` and re-fetches the auth profile to immediately render shiny `PRO` badges across the UI.

### 4. Direct Google OAuth 2.0 Integration
- **Approach**:
  1. Implemented `signInWithGoogle` using Firebase Auth `GoogleAuthProvider` and `signInWithPopup`.
  2. Upon successful authentication, check if a profile document exists in Firestore (`db.collection('users').doc(user.uid)`).
  3. If missing, initialize a new `UserProfile` document with Google display name, email, and photo URL, enabling seamless zero-config onboarding.

### 5. App-Wide UI Smoothness & Animations
- Implemented `scroll-behavior: smooth` globally in CSS.
- Designed cubic-bezier transition curves for modal overlays, card hovers (`hover:-translate-y-[2px] transition-all duration-200 ease-out`), active press feedback (`active:scale-[0.98]`), and micro-animated geometric shapes (`animate-shape-bounce`, `animate-shape-pulse`).

---

## 📷 Screenshots of Final Outputs

### 1. Dashboard Overview
*Vibrant metric cards with top accent colors, project progress bars, and upcoming deadlines.*
![Dashboard Overview](screenshots/dashboard.png)

---

### 2. User Profile & Synced Workspace Activity
*Real-time task statistics, user bio, active projects, and workspace activity feed.*
![User Profile](screenshots/profile.png)

---

### 3. Direct Google Authentication
*Clean login interface featuring 1-click Google Sign-In button.*
![Google Authentication](screenshots/google_auth.png)

---

### 4. Pro Membership Payment Gateway Modal
*Interactive pseudo checkout modal with billing toggles, live credit card widget, and plan choices.*
![Payment Gateway Modal](screenshots/payment_gateway.png)

---

### 5. Account & Subscription Settings
*Settings page displaying active PRO membership status and account details.*
![Settings & Subscription](screenshots/settings.png)

---

## 🛠️ Installation and Running Locally

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shubhrrgunjan/TJ-Tasks-2026-Shubhr-Gunjan.git
   cd TJ-Tasks-2026-Shubhr-Gunjan
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License
Created for **TJ-Tasks 2026**. All rights reserved.
