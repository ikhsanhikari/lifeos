# UI/UX Revamp — LifeOS Dashboard

> **Tujuan:** Transformasi dari single-page monolith yang ramai → dashboard modern, bersih, dan responsive dengan navigasi sidebar, layout terstruktur, dan UX yang intuitif.

---

## Analisis Masalah UI/UX Saat Ini

### ❌ Masalah yang Ditemukan

| # | Masalah | Dampak UX |
|---|---------|-----------|
| 1 | **Single-page monolith** — Semua fitur (stats, habits, tasks, journal, analytics, modals) dijejali dalam 1 file 1141 baris | User overwhelmed, cognitive overload |
| 2 | **Tidak ada navigasi** — Tidak ada sidebar/navbar, user harus scroll panjang untuk akses fitur | Discoverability buruk |
| 3 | **Header terlalu ramai** — Login status, add habit, logout, telegram link semua di satu baris | Visual clutter, bingung prioritas aksi |
| 4 | **Font terlalu kecil** — Banyak `text-xs` (10px-11px) di seluruh UI | Readability buruk, eye strain |
| 5 | **Terlalu banyak label teknis** — "(DB Live)", "(Telegram Bot `/streak`)", "(Bisa diisi via Telegram `/log`)" | Terasa seperti debug panel, bukan product |
| 6 | **Emoji sebagai icon** — 🎯📋📖🔥 digunakan sebagai visual utama | Tidak konsisten, kurang profesional |
| 7 | **Warna monoton** — Hampir semua card identik (glass-card gelap + indigo accent) | Tidak ada visual hierarchy |
| 8 | **Responsive kurang optimal** — Grid mobile tidak teroptimasi, padding terlalu kecil | UX mobile jelek |
| 9 | **Tidak ada empty state yang engaging** — Hanya teks biasa saat data kosong | Terasa "broken", bukan "inviting" |
| 10 | **Tidak ada loading skeleton** — Hanya teks "Memuat data..." | Perceived performance buruk |

---

## Proposed Design Direction

### 🎨 Design System: "Calm Productivity"

Inspirasi: Linear, Notion, Arc Browser — clean, spacious, purposeful.

**Prinsip:**
1. **Breathing Space** — Generous whitespace, tidak padat
2. **Progressive Disclosure** — Tampilkan info esensial dulu, detail bisa di-expand
3. **Clear Hierarchy** — Setiap section punya tujuan jelas
4. **Contextual Actions** — Tombol muncul di konteks yang tepat
5. **Consistent Visual Language** — Icon library yang konsisten (Lucide/Heroicons), bukan emoji campur-campur

### 🎨 Color Palette

```
Background:     #09090b (zinc-950)  — lebih hangat dari current #0b0f19
Surface:        #18181b (zinc-900)  — card background
Surface Hover:  #27272a (zinc-800)  — interactive state
Border:         #3f3f46 (zinc-700)  — subtle borders
                
Text Primary:   #fafafa (zinc-50)   
Text Secondary: #a1a1aa (zinc-400)  
Text Muted:     #71717a (zinc-500)  

Accent:         #818cf8 (indigo-400) — primary action
Success:        #34d399 (emerald-400)
Warning:        #fbbf24 (amber-400)
Danger:         #f87171 (red-400)
```

### 📐 Typography

```
Font:           Inter (Google Fonts) — modern, highly legible
Body:           14px (text-sm)      — naik dari 10-11px
Small:          12px (text-xs)      — hanya untuk metadata
Heading:        18-24px             — section titles
Display:        28-32px             — stat numbers
```

---

## Proposed Layout Architecture

### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌───────────────────────────────────────┐ │
│  │          │  │  Top Bar (greeting, date, actions)     │ │
│  │          │  ├───────────────────────────────────────┤ │
│  │ Sidebar  │  │                                       │ │
│  │ (240px)  │  │       Main Content Area               │ │
│  │          │  │       (scrollable)                     │ │
│  │ - Home   │  │                                       │ │
│  │ - Habits │  │  ┌─────────────────────────────────┐  │ │
│  │ - Tasks  │  │  │  Quick Stats (4 cards compact)  │  │ │
│  │ - Journal│  │  ├─────────────┬───────────────────┤  │ │
│  │ - Streak │  │  │  Habits     │  Tasks             │  │ │
│  │          │  │  │  Panel      │  Panel              │  │ │
│  │ ──────── │  │  │  (left)     │  (right)            │  │ │
│  │ Settings │  │  └─────────────┴───────────────────┘  │ │
│  │ Telegram │  │  ┌─────────────────────────────────┐  │ │
│  │          │  │  │  Daily Journal (collapsible)     │  │ │
│  └──────────┘  │  └─────────────────────────────────┘  │ │
│                └───────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Tablet (768px–1023px)

```
┌────────────────────────────────────┐
│  ┌──────┐  ┌─────────────────────┐ │
│  │ Icon │  │  Main Content       │ │
│  │ Only │  │  (single column)    │ │
│  │ Side │  │                     │ │
│  │ bar  │  │  Stats → Habits →   │ │
│  │(64px)│  │  Tasks → Journal    │ │
│  └──────┘  └─────────────────────┘ │
└────────────────────────────────────┘
```

### Mobile (<768px)

```
┌──────────────────────┐
│  Top Bar (hamburger)  │
├──────────────────────┤
│                      │
│  Full-width Content  │
│  (single column)     │
│                      │
│  Stats (2x2 grid)   │
│  Habits (full)       │
│  Tasks (full)        │
│  Journal (full)      │
│                      │
├──────────────────────┤
│  Bottom Nav (4 tabs) │
│  🏠  🎯  📋  📓     │
└──────────────────────┘
```

---

## Proposed Changes

### Component Decomposition

File monolith 1141 baris akan dipecah menjadi komponen modular:

---

### 1. Layout & Navigation

#### [NEW] `app/dashboard/layout.tsx`
- Sidebar navigation component
- Responsive: full sidebar → icon-only → bottom nav
- Active state indicator dengan animated pill
- User avatar & quick actions di bottom sidebar

#### [MODIFY] [layout.tsx](file:///c:/Users/Nurikhsan/Documents/project/lifeos/app/layout.tsx)
- Import Google Fonts (Inter)
- Improved meta tags
- Smooth page transitions

---

### 2. Core Dashboard Components

#### [NEW] `app/dashboard/components/Sidebar.tsx`
- Navigation items: Home, Habits, Tasks, Journal, Analytics
- Collapsible pada tablet (icon-only mode)
- User profile section di bottom
- Telegram link status indicator
- Logout button

#### [NEW] `app/dashboard/components/TopBar.tsx`
- Greeting + tanggal (clean, tanpa label teknis)
- Quick action: "+ New" dropdown (habit/task)
- Mobile hamburger menu trigger

#### [NEW] `app/dashboard/components/StatsGrid.tsx`
- 4 stat cards yang compact dan clean
- Tanpa label "(DB Live)" — cukup data yang relevan
- Micro-animation pada angka (count-up)
- Color-coded berdasarkan performance

#### [NEW] `app/dashboard/components/HabitPanel.tsx`
- Clean list dengan inline check-in toggle
- Progress ring (circular) di header
- Filter tabs yang lebih subtle
- "Add habit" sebagai inline form (bukan modal terpisah)
- Empty state yang engaging: ilustrasi + CTA

#### [NEW] `app/dashboard/components/TaskPanel.tsx`
- Inline add task (keyboard shortcut: Enter)
- Priority sebagai colored dot, bukan text badge
- Swipe-to-complete di mobile
- Clean grouping: Today → Upcoming → Completed

#### [NEW] `app/dashboard/components/DailyJournal.tsx`
- Collapsible section (default: collapsed jika sudah terisi)
- Mood picker yang lebih elegant (slider/emoji row)
- Energy picker sebagai visual bar
- Auto-save indicator

#### [NEW] `app/dashboard/components/StreakInsights.tsx`
- Mini heatmap calendar (GitHub-style)
- Top streaks ranking
- Hanya tampil jika ada data

#### [NEW] `app/dashboard/components/EmptyState.tsx`
- Reusable empty state component
- Ilustrasi/icon + deskripsi + CTA button
- Variant: habits, tasks, journal

#### [NEW] `app/dashboard/components/LoadingSkeleton.tsx`
- Skeleton placeholder yang match layout
- Pulsing animation
- Per-section skeleton (stats, habits, tasks)

---

### 3. Modal Components

#### [NEW] `app/dashboard/components/modals/AddHabitModal.tsx`
- Extracted dari page utama
- Slide-up animation di mobile
- Auto-focus pada input
- Keyboard navigation support

#### [NEW] `app/dashboard/components/modals/TelegramLinkModal.tsx`
- Extracted dari page utama
- QR code style token display
- Countdown timer visual
- Success animation

---

### 4. Shared UI Components

#### [NEW] `app/components/ui/Card.tsx`
- Consistent card styling
- Variant: default, elevated, interactive
- Proper hover/focus states

#### [NEW] `app/components/ui/Button.tsx`
- Variant: primary, secondary, ghost, danger
- Size: sm, md, lg
- Loading state built-in

#### [NEW] `app/components/ui/Badge.tsx`
- Priority badges
- Status badges
- Frequency badges

#### [NEW] `app/components/ui/ProgressBar.tsx`
- Linear progress
- Circular progress ring
- Animated transitions

#### [NEW] `app/components/ui/Tabs.tsx`
- Clean tab component
- Animated active indicator

---

### 5. Styling

#### [MODIFY] [globals.css](file:///c:/Users/Nurikhsan/Documents/project/lifeos/app/globals.css)
- Import Inter font
- Updated CSS custom properties (design tokens)
- Improved glassmorphism utilities
- Skeleton animation utilities
- Scroll behavior: smooth
- Focus-visible styles untuk accessibility
- Transition utilities

#### [MODIFY] [tailwind.config.js](file:///c:/Users/Nurikhsan/Documents/project/lifeos/tailwind.config.js)
- Extended color palette (zinc-based)
- Custom animation keyframes
- Typography plugin integration

---

### 6. Main Dashboard Page

#### [MODIFY] [page.tsx](file:///c:/Users/Nurikhsan/Documents/project/lifeos/app/dashboard/page.tsx)
- Refactored: dari 1141 baris → ~200 baris (composition of components)
- Custom hooks extracted: `useHabits`, `useTasks`, `useDailyLog`, `useAnalytics`
- Clean data flow via props
- Proper loading/error/empty states

---

## UX Improvements Detail

### Interaction Design

| Area | Sebelum | Sesudah |
|------|---------|---------|
| **Check-in habit** | Click seluruh row | Tap checkbox, row tetap informational |
| **Add task** | Input + select + button | Inline input, Enter to submit, priority selector on focus |
| **Mood picker** | 5 buttons horizontal | Elegant slider dengan emoji yang scale |
| **Delete** | Click 🗑️ emoji | Swipe atau kebab menu → confirm |
| **Empty states** | Teks plain "Tidak ada" | Illustrated empty state + CTA |
| **Loading** | Teks "Memuat..." | Skeleton placeholders |
| **Success feedback** | Alert banner | Subtle toast notification |

### Accessibility

- Proper `aria-label` pada semua interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus-visible rings
- Sufficient color contrast (WCAG AA minimum)
- Reduced motion: respect `prefers-reduced-motion`

### Performance

- Component lazy loading dengan `React.lazy` + `Suspense`
- Skeleton loading untuk perceived performance
- Optimistic UI updates (sudah ada, akan dipertahankan)

---

## User Review Required

> [!IMPORTANT]
> **Layout Choice:** Saya merekomendasikan sidebar navigation (seperti Linear/Notion) karena ini dashboard app yang dipakai daily. Apakah kamu setuju dengan pendekatan sidebar, atau prefer top navigation bar saja?

> [!IMPORTANT]
> **Color Scheme:** Saya merekomendasikan tetap dark mode tapi dengan warna yang lebih hangat (zinc-based, bukan slate-based). Apakah tetap dark-only, atau mau support light mode juga?

> [!IMPORTANT]
> **Bottom Navigation di Mobile:** Untuk mobile, saya sarankan bottom navigation bar (seperti app native) bukan hamburger menu. Setuju?

> [!IMPORTANT]
> **Bahasa UI:** Saat ini campuran Indonesia-English. Mau distandarkan ke bahasa apa? (Saya rekomendasikan full Indonesian untuk consistency)

---

## Verification Plan

### Build Verification
```bash
npm run build
```
- Pastikan zero TypeScript errors
- Pastikan Next.js build sukses

### Visual Verification
- Screenshot perbandingan before/after
- Test di 3 breakpoint: Mobile (375px), Tablet (768px), Desktop (1440px)
- Verify di browser: Chrome, Firefox, Safari

### Functional Verification
- Semua API calls tetap berfungsi (tidak ada perubahan logic)
- Toggle habit check-in
- Add/delete habit
- Add/delete task
- Save daily journal
- Telegram link flow
- Auth callback flow
