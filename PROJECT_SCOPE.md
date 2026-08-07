# Life OS — Architecture Blueprint

> **Versi:** 0.1.0 · **Target:** Personal-first, public-ready  
> **Stack:** Next.js (App Router) · Hono · PostgreSQL + Prisma · Telegram Bot (Telegraf)

---

## 1. Project Structure (Turborepo Monorepo)

```
lifeos/
├── apps/
│   ├── web/                     # Next.js (App Router, Tailwind CSS)
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, Register, Callback
│   │   │   ├── (dashboard)/     # Protected layout
│   │   │   │   ├── habits/
│   │   │   │   ├── tasks/
│   │   │   │   ├── daily-log/
│   │   │   │   └── analytics/
│   │   │   ├── api/             # Next.js Route Handlers (BFF / proxy)
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/              # Primitif (Button, Card, Modal)
│   │   │   └── features/       # Domain-specific composites
│   │   ├── lib/                 # Client-side helpers, API client
│   │   ├── hooks/
│   │   └── styles/
│   │
│   ├── api/                     # Hono HTTP server
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.route.ts
│   │   │   │   ├── habit.route.ts
│   │   │   │   ├── task.route.ts
│   │   │   │   ├── daily-log.route.ts
│   │   │   │   └── analytics.route.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── rate-limit.middleware.ts
│   │   │   │   └── error-handler.middleware.ts
│   │   │   ├── services/        # Business logic layer
│   │   │   ├── validators/      # Zod schemas per-route
│   │   │   └── index.ts         # Hono app entry
│   │   └── tsconfig.json
│   │
│   └── bot/                     # Telegram Bot (Telegraf)
│       ├── src/
│       │   ├── commands/        # Satu file per command
│       │   ├── scenes/          # Multi-step wizard (Telegraf Scenes)
│       │   ├── keyboards/       # Inline & reply keyboard builders
│       │   ├── handlers/        # Callback query & text handlers
│       │   ├── cron/            # Node-cron jobs (reminder, daily recap)
│       │   └── index.ts         # Bot entry, webhook setup
│       └── tsconfig.json
│
├── packages/
│   ├── db/                      # Prisma client + schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── index.ts             # Export PrismaClient singleton
│   │
│   ├── shared/                  # Shared types, constants, enums
│   │   ├── types/
│   │   ├── constants/
│   │   └── utils/
│   │
│   └── config/                  # Shared configs (TS, ESLint, Tailwind)
│       ├── tsconfig.base.json
│       ├── eslint-preset.js
│       └── tailwind-preset.ts
│
├── docker-compose.yml           # PostgreSQL + Redis (dev)
├── turbo.json
├── package.json
├── .env.example
└── README.md
```

### Keputusan Arsitektur

| Keputusan | Alasan |
|---|---|
| **Turborepo monorepo** | Shared types & Prisma client tanpa publish package; satu `pnpm install` untuk semua apps |
| **Hono sebagai API** | Lightweight, edge-compatible, mudah migrasi ke Cloudflare Workers saat scale |
| **Bot sebagai app terpisah** | Independen lifecycle; bisa di-deploy & restart tanpa mengganggu API |
| **`packages/db`** | Single source of truth untuk schema; diimpor oleh `api` dan `bot` |
| **BFF pattern di Next.js** | Route Handlers di `app/api/` proxy ke Hono API; menjaga API token tidak bocor ke client |

---

## 2. Database Schema Plan

### 2.1 Entity Relationship Overview

```
User ─┬─< Habit ──< HabitLog
      ├─< Task
      ├─< DailyLog
      └─< TelegramLink
```

### 2.2 Tabel & Field

#### `User`
| Field | Type | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| email | String (unique) | Login via OAuth / magic link |
| name | String | |
| avatar_url | String? | |
| timezone | String | Default `Asia/Jakarta`; dipakai scheduling cron |
| created_at | Timestamp | |
| updated_at | Timestamp | |

#### `TelegramLink`
| Field | Type | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → User, unique) | 1 user = 1 Telegram |
| telegram_chat_id | BigInt (unique) | Dari `ctx.chat.id` |
| telegram_username | String? | |
| linked_at | Timestamp | |
| is_active | Boolean | Untuk pause notifikasi |

> **Relasi:** `User 1 ↔ 1 TelegramLink`

#### `Habit`
| Field | Type | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| name | String | e.g., "Olahraga 30 menit" |
| description | String? | |
| frequency | Enum | `DAILY`, `WEEKLY`, `CUSTOM` |
| frequency_config | JSON? | Untuk custom: `{ days: [1,3,5] }` |
| reminder_time | Time? | Jam reminder via Telegram |
| color | String? | Hex color untuk UI |
| is_archived | Boolean | Soft delete |
| sort_order | Int | Drag-and-drop ordering |
| created_at | Timestamp | |

> **Relasi:** `User 1 ─< Habit` (satu user punya banyak habit)

#### `HabitLog`
| Field | Type | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| habit_id | UUID (FK → Habit) | |
| date | Date | Tanggal checkin |
| status | Enum | `DONE`, `SKIPPED`, `MISSED` |
| note | String? | Catatan singkat opsional |
| completed_at | Timestamp? | Waktu aktual selesai |

> **Relasi:** `Habit 1 ─< HabitLog`  
> **Constraint:** Unique(`habit_id`, `date`) — satu checkin per habit per hari

#### `Task`
| Field | Type | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| title | String | |
| description | String? | |
| priority | Enum | `URGENT`, `HIGH`, `MEDIUM`, `LOW` |
| status | Enum | `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED` |
| due_date | Date? | |
| due_time | Time? | |
| tags | String[] | Array of tag labels |
| parent_id | UUID? (FK → Task) | Self-referential untuk subtask |
| sort_order | Int | |
| completed_at | Timestamp? | |
| created_at | Timestamp | |

> **Relasi:** `User 1 ─< Task`, `Task 1 ─< Task` (subtask tree)

#### `DailyLog`
| Field | Type | Keterangan |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| date | Date | |
| mood | Int | Skala 1-5 |
| energy | Int | Skala 1-5 |
| journal | Text? | Free-text journaling |
| highlights | String[] | Array bullet-point highlights |
| created_at | Timestamp | |
| updated_at | Timestamp | |

> **Relasi:** `User 1 ─< DailyLog`  
> **Constraint:** Unique(`user_id`, `date`) — satu log per hari per user

### 2.3 Index Plan

| Tabel | Index | Tujuan |
|---|---|---|
| HabitLog | `(habit_id, date)` | Lookup checkin + unique constraint |
| HabitLog | `(date)` dimana habit_id IN user's habits | Dashboard hari ini |
| Task | `(user_id, status, due_date)` | Filter task aktif |
| DailyLog | `(user_id, date)` | Lookup harian + unique constraint |
| TelegramLink | `(telegram_chat_id)` | Resolve user dari incoming message |

---

## 3. API Route Design

```
BASE: /api/v1

Auth
  POST   /auth/login            # Magic link / OAuth initiate
  POST   /auth/callback          # OAuth callback
  POST   /auth/refresh           # Refresh token
  DELETE /auth/logout

Habits
  GET    /habits                 # List (filter: archived)
  POST   /habits                 # Create
  PATCH  /habits/:id             # Update
  DELETE /habits/:id             # Archive (soft)
  POST   /habits/:id/check-in   # Log hari ini
  GET    /habits/:id/logs        # History (query: from, to)

Tasks
  GET    /tasks                  # List (filter: status, priority, due_date)
  POST   /tasks                  # Create
  PATCH  /tasks/:id              # Update
  DELETE /tasks/:id              # Cancel
  GET    /tasks/:id/subtasks     # List subtasks

Daily Log
  GET    /daily-logs             # List (query: from, to)
  GET    /daily-logs/today       # Get or init today's log
  POST   /daily-logs             # Create
  PATCH  /daily-logs/:id         # Update

Analytics
  GET    /analytics/habits       # Streak, completion rate (query: period)
  GET    /analytics/mood         # Mood trend (query: period)
  GET    /analytics/summary      # Weekly/monthly summary

Telegram
  POST   /telegram/link          # Generate link token
  POST   /telegram/webhook       # Telegraf webhook endpoint
```

---

## 4. Telegram Bot Integration Flow

### 4.1 Arsitektur Webhook

```
Telegram Server
      │
      ▼  POST /api/v1/telegram/webhook
 ┌─────────┐
 │ Hono API │──── Forward raw body ────▶ Telegraf.handleUpdate()
 └─────────┘                                    │
                                                ▼
                                          Bot Command/
                                          Scene Router
                                                │
                                    ┌───────────┼───────────┐
                                    ▼           ▼           ▼
                              Commands     Scenes      Callbacks
                                    │           │           │
                                    └───────────┼───────────┘
                                                ▼
                                         Service Layer
                                         (packages/db)
```

> **Catatan:** Webhook URL di-set sekali via `bot.telegram.setWebhook(url)` saat deploy. Lokal development pakai polling mode.

### 4.2 Linking Flow

1. User klik "Hubungkan Telegram" di web dashboard
2. API generate **one-time token** (expire 5 menit), simpan di Redis/DB
3. Web tampilkan deep link: `https://t.me/LifeOSBot?start=<token>`
4. User klik link → Telegram buka bot → trigger `/start <token>`
5. Bot kirim token ke API → API validasi token → buat `TelegramLink` record
6. Bot reply: "✅ Akun terhubung! Ketik /help untuk mulai."

### 4.3 Command & Scene Reference

| Command | Tipe | Deskripsi |
|---|---|---|
| `/start` | Command | Onboarding + link account |
| `/help` | Command | Daftar command tersedia |
| `/habits` | Command | Tampilkan habit hari ini + inline buttons untuk checkin |
| `/checkin` | Scene (Wizard) | Step 1: Pilih habit → Step 2: Status (✅/⏭️) → Step 3: Note (opsional) |
| `/task` | Scene (Wizard) | Step 1: Judul → Step 2: Prioritas (inline buttons) → Step 3: Due date (opsional) |
| `/log` | Scene (Wizard) | Step 1: Mood (1-5 emoji) → Step 2: Energy (1-5) → Step 3: Highlights → Step 4: Journal (opsional) |
| `/today` | Command | Ringkasan hari ini: habits done/total, tasks due, mood |
| `/streak` | Command | Tampilkan current streak per habit |
| `/unlink` | Command | Putuskan koneksi Telegram |

### 4.4 Push Notification (Cron Jobs)

| Job | Schedule | Aksi |
|---|---|---|
| **Morning Reminder** | Sesuai `User.timezone`, default 07:00 | Kirim daftar habit hari ini + tasks due today |
| **Habit Reminder** | Sesuai `Habit.reminder_time` | Remind habit spesifik yang belum di-checkin |
| **Evening Recap** | Sesuai `User.timezone`, default 21:00 | Prompt `/log` jika belum isi daily log |
| **Streak Alert** | 22:00 (timezone user) | Warning jika ada habit yang belum checkin dan streak > 7 hari |

> **Implementasi:** Node-cron di `apps/bot/src/cron/`. Query user berdasarkan timezone bucket untuk efisiensi.

---

## 5. Auth Strategy

| Aspek | Pilihan |
|---|---|
| **Provider** | NextAuth.js v5 (Auth.js) di `apps/web` |
| **Method** | Google OAuth + Magic Link (email) |
| **Session** | JWT (stateless, cocok untuk edge) |
| **API Auth** | Bearer token; `apps/web` Route Handler attach token ke request ke Hono API |
| **Bot Auth** | Resolved via `telegram_chat_id` → `TelegramLink` → `User`; tidak perlu login terpisah |

---

## 6. Deployment Plan (Scale-Ready)

```
                    ┌──────────────┐
                    │  Cloudflare  │
                    │   DNS/CDN    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Vercel   │ │ Railway/ │ │ Railway/ │
        │ (web)    │ │ Fly.io   │ │ Fly.io   │
        │ Next.js  │ │ (api)    │ │ (bot)    │
        └──────────┘ │ Hono     │ │ Telegraf │
                     └──────────┘ └──────────┘
                           │            │
                           ▼            ▼
                     ┌──────────────────────┐
                     │   Supabase / Neon    │
                     │   (PostgreSQL)       │
                     ├──────────────────────┤
                     │   Upstash Redis      │
                     │   (Rate limit, cache,│
                     │    link tokens)      │
                     └──────────────────────┘
```

| Service | Platform | Alasan |
|---|---|---|
| **Web** | Vercel | Native Next.js support, edge functions |
| **API** | Railway / Fly.io | Persistent process, WebSocket-ready jika perlu |
| **Bot** | Railway / Fly.io | Persistent process untuk webhook + cron |
| **DB** | Neon / Supabase | Serverless PostgreSQL, connection pooling |
| **Cache** | Upstash Redis | Serverless Redis, rate limiting, token store |

---

## 7. Scaling Considerations

| Area | Personal Phase | Public Phase |
|---|---|---|
| **Multi-tenancy** | Single user, skip auth check | Full auth + row-level `user_id` filtering |
| **Rate Limiting** | Tidak perlu | Per-user rate limit via Redis sliding window |
| **Bot Concurrency** | Single instance | Webhook mode auto-scales; stateless handler |
| **DB Connection** | Direct connection | Connection pooling via PgBouncer / Neon proxy |
| **Cron** | Simple `node-cron` | Migrate ke BullMQ + Redis untuk distributed job queue |
| **Observability** | `console.log` | Structured logging (Pino) + error tracking (Sentry) |
| **Analytics Query** | Real-time query | Pre-computed materialized views / aggregation table |
