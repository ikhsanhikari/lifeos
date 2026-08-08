# LifeOS AI Integration — Implementation Plan

> Integrasi ChatGPT Mini (OpenAI `gpt-4o-mini`) ke LifeOS untuk fitur AI yang **high-impact** dan **configurable**

---

## Background & Tujuan

LifeOS saat ini sudah punya ekosistem lengkap: Goals → Tasks → Habits → Daily Journal → Telegram Bot. AI akan **memperkuat workflow yang sudah ada**, bukan menambah complexity baru. Prinsipnya: **AI sebagai coach, bukan sebagai fitur terpisah**.

---

## 🎯 3 High-Impact AI Features (Prioritas)

### Feature 1: 🧠 AI Goal Breakdown ★★★★★ (HIGHEST IMPACT)

**Apa:** Saat user membuat Goal baru, AI otomatis meng-generate daftar task breakdown yang actionable.

**Mengapa High Impact:**
- Saat ini user harus **manual** memikirkan dan mengetik setiap task satu-satu
- Goal breakdown adalah **bottleneck terbesar** — banyak user punya mimpi tapi bingung mulai dari mana
- AI membantu "berpikir" dan menghasilkan langkah konkret dalam hitungan detik

**User Flow:**
```
User buat Goal "Launch LifeOS ke 100 User"
    → AI generate 5-8 task breakdown:
       ✅ Buat landing page product
       ✅ Setup analytics tracking  
       ✅ Buat konten social media (5 post)
       ✅ Kirim ke 10 komunitas developer
       ✅ Setup feedback form untuk early users
       ...
    → User bisa accept all, edit, atau remove per task
```

**Placement:**
- **Web:** Tombol "✨ AI Breakdown" di `AddGoalModal` dan `GoalPanel` (expanded view)
- **Telegram:** Otomatis suggest saat `/goal <judul>` — "Mau saya breakdown goal ini?"

---

### Feature 2: 📖 AI Daily Coach ★★★★☆ (HIGH IMPACT)

**Apa:** AI menganalisis journal entry, mood pattern, dan habit streaks user lalu memberikan **insight & coaching personal**.

**Mengapa High Impact:**
- Daily Journal saat ini hanya "tulis dan simpan" — tidak ada feedback
- User tidak punya cara melihat pattern dari data mereka sendiri
- AI coach membuat journaling terasa lebih **bermakna dan rewarding**

**User Flow:**
```
User tulis jurnal hari ini: "Hari ini capek banget, banyak meeting..."
    → AI Coach respond:
       "📊 Mood kamu turun dari 4.0 ke 2.0 dalam 3 hari terakhir.
        Pattern: setiap Rabu mood kamu cenderung drop.
        💡 Saran: Coba kurangi meeting di hari Rabu, atau tambah habit
        'Short walk 10 min' sebelum lunch."
```

**Placement:**
- **Web:** Tombol "🤖 Minta Insight AI" di bawah `DailyJournal` section setelah simpan journal
- **Telegram:** Otomatis dikirim sebagai bagian dari Evening Recap (`/today` command enhanced)

---

### Feature 3: 📊 AI Smart Summary ★★★☆☆ (MEDIUM-HIGH IMPACT)

**Apa:** AI generate rangkuman mingguan cerdas: apa yang berhasil, apa yang bisa diperbaiki, pattern yang terdeteksi.

**Mengapa High Impact:**
- Analytics saat ini hanya angka mentah (streak count, focus score)
- AI memberi **narasi yang human-readable** dan actionable
- Membantu user reflect tanpa harus menganalisis data sendiri

**User Flow:**
```
Setiap Minggu malam (atau on-demand via /summary):
    → "📋 Ringkasan Minggu Ini:
        ✅ 4 dari 5 habit konsisten — 'Olahraga' dan 'Baca Buku' perfect!
        ⚠️ Habit 'Meditasi' hanya 2/7 hari — coba set reminder pagi
        📈 Mood trend naik dari rata-rata 2.8 ke 3.6
        🎯 Goal 'Launch LifeOS' progress 60% — 2 task tersisa
        💡 Kamu paling produktif di hari Senin dan Kamis"
```

**Placement:**
- **Web:** Section baru "AI Insights" di dashboard atau sebagai modal
- **Telegram:** Cron job mingguan + on-demand via `/summary`

---

## ⚙️ Configurable AI System — Architecture

> [!IMPORTANT]
> AI harus **configurable** dan **graceful** — app tetap berfungsi 100% tanpa AI

### Level 1: Environment-Level Kill Switch

```env
# .env / .env.production
OPENAI_API_KEY="sk-..."              # Jika kosong/tidak ada → semua AI fitur disabled
OPENAI_MODEL="gpt-4o-mini"           # Default: gpt-4o-mini (murah & cepat)
AI_ENABLED=true                       # Master switch
```

Jika `OPENAI_API_KEY` tidak di-set → semua tombol AI tersembunyi, tidak ada error.

### Level 2: Per-User Feature Toggle (Database)

#### [NEW] Prisma Model: `UserSettings`

```prisma
model UserSettings {
  id                String  @id @default(uuid()) @db.Uuid
  userId            String  @unique @map("user_id") @db.Uuid
  
  // AI Feature Flags
  aiEnabled         Boolean @default(true) @map("ai_enabled")
  aiGoalBreakdown   Boolean @default(true) @map("ai_goal_breakdown")
  aiDailyCoach      Boolean @default(true) @map("ai_daily_coach")  
  aiSmartSummary    Boolean @default(true) @map("ai_smart_summary")
  
  // Future-proof
  aiMonthlyQuota    Int     @default(50) @map("ai_monthly_quota")   // Rate limit per user
  aiUsageThisMonth  Int     @default(0)  @map("ai_usage_this_month")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_settings")
}
```

**Flow:**
1. User pertama kali → `UserSettings` auto-created dengan default `aiEnabled: true`
2. Admin/self-service bisa toggle per feature
3. UI check: `if (settings.aiEnabled && settings.aiGoalBreakdown)` → show AI button
4. Quota system: jika `aiUsageThisMonth >= aiMonthlyQuota` → disable sampai reset

### Level 3: API Response — Graceful Degradation

```json
// GET /api/ai/status → Frontend check this on dashboard load
{
  "success": true,
  "aiAvailable": true,           // false jika OPENAI_API_KEY tidak ada
  "features": {
    "goalBreakdown": true,
    "dailyCoach": true,
    "smartSummary": false         // user disabled
  },
  "quota": {
    "used": 12,
    "limit": 50,
    "remaining": 38
  }
}
```

Frontend hanya menampilkan tombol AI jika `aiAvailable && features.xxx === true`.

---

## 📁 Proposed Changes — File-by-File

### Backend

---

#### [NEW] `src/services/aiService.ts`
Core AI service yang handle semua OpenAI API calls:

```typescript
// Responsibilities:
// - Initialize OpenAI client (dengan fallback jika API key tidak ada)
// - generateGoalBreakdown(goalTitle, goalDescription) → Task[]
// - generateDailyCoachInsight(journalEntry, moodHistory, habitStreaks) → string
// - generateWeeklySummary(weekData) → string
// - checkQuota(userId) → { allowed: boolean, remaining: number }
// - incrementUsage(userId) → void
```

Key design decisions:
- Semua function return `null` jika AI tidak available (bukan throw error)
- System prompt di-hardcode per feature (not user-configurable)
- Response di-parse sebagai structured JSON (bukan free text) menggunakan JSON mode
- Temperature rendah (0.3-0.5) untuk konsistensi

---

#### [NEW] `src/controllers/aiController.ts`
Controller untuk REST API endpoints:

```typescript
// Exported functions:
// - handleAiGoalBreakdown(req, res) — POST /api/ai/goal-breakdown
// - handleAiDailyCoach(req, res) — POST /api/ai/daily-coach
// - handleAiWeeklySummary(req, res) — GET /api/ai/weekly-summary
// - handleAiStatus(req, res) — GET /api/ai/status
```

---

#### [MODIFY] [server.ts](file:///c:/Users/Nurikhsan/Documents/project/lifeos/src/server.ts)
Tambah 4 API routes baru:

```
POST /api/ai/goal-breakdown     # Body: { goalId, goalTitle, goalDescription }
POST /api/ai/daily-coach        # Body: { journalEntry, mood, energy }  
GET  /api/ai/weekly-summary     # Query: { period: "this-week" | "last-week" }
GET  /api/ai/status             # Check AI availability + user quota
```

---

#### [MODIFY] [schema.prisma](file:///c:/Users/Nurikhsan/Documents/project/lifeos/prisma/schema.prisma)
- Tambah model `UserSettings` 
- Tambah relation `User.settings → UserSettings`

---

#### [MODIFY] `.env.example` / `.env.production.example`
Tambah variabel baru:
```
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
AI_ENABLED=true
```

---

### Frontend

---

#### [NEW] `app/dashboard/components/AiChatPanel.tsx`
Floating AI insight panel (bukan full chat, tapi contextual AI response display):
- Muncul sebagai **slide-in panel dari kanan** saat user klik tombol AI
- Menampilkan AI response dalam format markdown-like
- Loading state dengan typing animation
- Close button untuk dismiss

---

#### [MODIFY] [GoalPanel.tsx](file:///c:/Users/Nurikhsan/Documents/project/lifeos/app/dashboard/components/GoalPanel.tsx)
- Tambah tombol "✨ AI Breakdown" di header goal (expanded view)
- Saat diklik → call `POST /api/ai/goal-breakdown`
- Tampilkan hasil sebagai checklist → user bisa accept/reject per task
- Tombol hidden jika `aiStatus.features.goalBreakdown === false`

---

#### [MODIFY] [DailyJournal.tsx](file:///c:/Users/Nurikhsan/Documents/project/lifeos/app/dashboard/components/DailyJournal.tsx)
- Tambah tombol "🤖 Minta Insight AI" setelah textarea journal
- Saat diklik → call `POST /api/ai/daily-coach`
- Response ditampilkan inline di bawah journal sebagai "AI Coach Response" card
- Tombol hidden jika AI coach disabled

---

#### [MODIFY] [page.tsx](file:///c:/Users/Nurikhsan/Documents/project/lifeos/app/dashboard/page.tsx)
- Fetch `GET /api/ai/status` saat dashboard load
- Pass `aiStatus` ke semua child components yang butuh AI
- Conditionally render AI buttons berdasarkan availability

---

### Telegram Bot

---

#### [MODIFY] [server.ts](file:///c:/Users/Nurikhsan/Documents/project/lifeos/src/server.ts) (Bot section)
- Tambah command `/ai` — "Tanya AI tentang progress kamu"
- Enhance `/goal <judul>` — auto-offer AI breakdown setelah goal dibuat
- Enhance evening recap cron — sisipkan AI insight jika enabled

---

## 🔒 Security & Cost Control

| Concern | Solution |
|---|---|
| **API Key exposure** | Key hanya di server-side `.env`, never exposed ke frontend |
| **Cost control** | Per-user monthly quota (default 50 calls/month) |
| **Rate limiting** | Max 3 AI calls per minute per user |
| **Prompt injection** | System prompt fixed, user input di-sanitize |
| **Data privacy** | Hanya kirim data user sendiri ke OpenAI, tidak cross-user |
| **Fallback** | Semua fitur normal tetap jalan tanpa AI |

---

## Open Questions

> [!IMPORTANT]
> Perlu konfirmasi sebelum implementasi:

1. **OpenAI API Key**: Apakah sudah punya API key OpenAI? Atau mau pakai provider lain (Groq, Anthropic, local LLM)?

2. **Model preference**: `gpt-4o-mini` direkomendasikan (murah ~$0.15/1M input tokens, cepat). Atau mau `gpt-4o` yang lebih smart tapi lebih mahal?

3. **Quota default**: 50 AI calls/bulan per user cukup? Atau mau lebih/kurang?

4. **Prioritas implementasi**: Mau implement ketiga AI feature sekaligus, atau mulai dari **AI Goal Breakdown** dulu (yang paling high-impact)?

5. **Bahasa AI response**: Mau AI jawab dalam Bahasa Indonesia, English, atau auto-detect dari input user?

---

## Verification Plan

### Automated Tests
```bash
# Test AI service with mock
npm run dev    # Start server, verify /api/ai/status returns correct flags

# Test without API key
unset OPENAI_API_KEY
# Verify all AI buttons hidden, app works normally
```

### Manual Verification
- Test AI Goal Breakdown: buat goal → klik AI Breakdown → verify task suggestions
- Test AI Daily Coach: tulis journal → klik insight → verify response contextual
- Test quota: exhaust quota → verify graceful disable
- Test without API key: verify semua tombol AI hidden, no errors
- Test via Telegram: `/ai` command works when enabled
