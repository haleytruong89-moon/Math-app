# Student UX — Handover for Claude Code

> **Context:** Phụ huynh duyệt mockup Student UX 05/10/2026. File này mô tả chính xác những gì cần
> implement để nâng cấp giao diện học sinh từ admin-style hiện tại sang warm engagement theme.
> Mockup tham chiếu: `https://claude.ai/artifact/LNFSgD23tfTxRb3Yi7vWbJ` (Design artifact, 3 artboards).
> Đọc cùng: `docs/DESIGN.md` §9 (student theme spec), `docs/SPEC.md` §0 (build decisions).

## 1. Tổng quan thay đổi

Student routes (`/student`, `/student/learn/*`, `/student/review`) chuyển từ ink-blue admin theme
sang **warm teal engagement theme**. Parent + tutor routes **giữ nguyên** theme hiện tại.

| Khía cạnh | Hiện tại | Sau thay đổi |
|---|---|---|
| Background | `#eef2f5` (pale blue-gray) | `#FFF8F0` (warm cream) |
| Accent | `#2454a6` (ink blue) | `#0D9488` (teal-600) |
| Weekly goal | Linear progress bar | SVG circle ring |
| Progress map | 2-col grid, colored M-circles | Vertical path, plant emoji nodes |
| Mastery badges | `M0`–`M4` text in colored circles | 🔒→🌱→🌿→🌳→⭐ emoji metaphor |
| Question feedback | Minimal (text only) | 2-state cards: celebration (green) + gentle-wrong (yellow) |
| Header | None (flat) | Teal gradient with greeting |

## 2. Theme tokens — Student-scoped

Theme tokens sống trong `src/app/globals.css`. Vì parent/tutor routes giữ theme cũ, cách triển khai
đề xuất: **CSS class `.student-theme`** trên student layout, override tokens cho student routes only.

```css
/* Student warm theme — applied via student layout wrapper */
.student-theme {
  --bg: #FFF8F0;
  --surface: #ffffff;
  --accent: #0D9488;        /* teal-600 */
  --accent-soft: #CCFBF1;   /* teal-100 */
  --on-accent: #ffffff;
  --good: #059669;           /* emerald-600 */
  --good-soft: #D1FAE5;      /* emerald-100 */
  --warn: #D97706;           /* amber-600 */
  --warn-soft: #FEF3C7;      /* amber-100 */

  /* Mastery scale — remap to plant metaphor colors */
  --m0: #D1D5DB;             /* gray-300 (locked) */
  --m1: #C4B5FD;             /* violet-300 (seedling) */
  --m2: #93C5FD;             /* blue-300 (sprout) */
  --m3: #5EEAD4;             /* teal-300 (tree) */
  --m4: #FCD34D;             /* amber-300 (star) */
}
```

**Dark mode cho student theme:** tạo tương ứng với `.student-theme` selector trong media query
`prefers-color-scheme: dark` và `[data-theme="dark"]`. Giữ contrast ratio ≥ 4.5:1.

## 3. Component changes — chi tiết từng file

### 3.1 Student Layout (`src/app/student/layout.tsx`)

**Thay đổi:**
- Wrap `{children}` trong `<div className="student-theme">` để kích hoạt student tokens.
- Thêm teal gradient header bar:
  ```
  Gradient: linear-gradient(135deg, #0D9488, #0F766E)
  Height: ~120px (bao gồm greeting + date)
  Content: "Chào {user.displayName}" (Source Serif 4, bold, white)
           + ngày hiện tại (small, white/70%)
  ```
- Header nằm trên cùng, cố định trong layout (không cuộn đi).

### 3.2 Weekly Goal (`src/app/student/page.tsx` → `WeeklyGoal`)

**Hiện tại:** Linear progress bar (`<div>` with `width: %`).

**Thay đổi sang SVG circle ring:**
```
SVG viewBox: 0 0 120 120
Circle: cx=60, cy=60, r=52
Stroke width: 10
Background track: #E2E8F0 (gray-200)
Progress stroke: #0D9488 (teal-600)
Rotation: -90deg (start from top)
Technique: stroke-dasharray = 2π×52 ≈ 326.7
           stroke-dashoffset = circumference × (1 - progress)
Center text: "{days}/{goal}" (IBM Plex Mono, bold)
             "buổi" (small, muted)
```

**Data source:** Giữ nguyên `state.studyDays` và `RULES.weeklyGoalDays`. Không cần query mới.

### 3.3 Progress Map (`src/app/student/page.tsx` → `ProgressMap`)

**Hiện tại:** 2-column grid, `M{level}` text in colored circles.

**Thay đổi sang vertical path map:**

```
Layout: single column, vertical path
Each node:
  - Left: gradient circle (60×60) with emoji
  - Right: unit title + status text
  - Connected by vertical gradient line (2px wide, centered on circles)

Emoji mapping (MASTERY_EMOJI constant):
  M0 → 🔒 (gray, dashed border, opacity 0.5)
  M1 → 🌱 (violet gradient #EDE9FE → #DDD6FE, border #8B5CF6)
  M2 → 🌿 (blue gradient #DBEAFE → #BFDBFE, border #2563EB)
  M3 → 🌳 (teal gradient #CCFBF1 → #99F6E4, border #0D9488)
  M4 → ⭐ (gold gradient #FEF3C7 → #FDE68A, border #F59E0B)

Status text per level:
  M0: "Chưa mở" (gray, italic)
  M1: "Đang học" or "Chưa đủ dữ liệu ({n} câu)" if < 5 answers
  M2: progress bar ({correct}/{total} practice accuracy) + e.g. "3/5 đúng"
  M3: review date if exists ("Ôn D+1 ngày mai")
  M4: maintenance review info ("Ôn D+21" or next maintenance date)

Connector lines:
  Active (M1+): solid gradient line
  Locked (M0): dashed gray line, reduced opacity
```

**Summary strip** (above the path): 3 boxes showing counts:
  - "X Đã vững" (green, M3+M4 count)
  - "X Đang học" (yellow, M1+M2 count)
  - "X Chưa mở" (gray, M0 count)

**Data source:** Giữ nguyên `state.units: UnitState[]`. Mỗi `UnitState` đã có:
- `unit.title`, `unit.id`
- `mastery.level` (0–4), `mastery.answers`, `mastery.enoughData`
- `review?.dueOn` (ngày ôn kế tiếp)
- `workedViewed` (đã xem lời giải mẫu)

Không cần thêm query hay thay đổi `loadStudentState()`.

### 3.4 Today List (`src/app/student/page.tsx` → `TodayList`, `TodayCard`)

**Thay đổi nhỏ:**
- `TodayCard` thêm mastery emoji bên trái title (lấy từ `MASTERY_EMOJI[unit.mastery.level]`).
- Badge colors giữ nguyên logic nhưng dùng student-theme tokens.
- CTA button dùng teal accent thay vì ink-blue.

**Data source:** Giữ nguyên hoàn toàn. Logic `dueReviews()`, `inProgress`, `nextNew` không đổi.

### 3.5 Question Feedback — **component mới**

**Vị trí:** Sau khi học sinh submit answer trong `/student/learn/[unitId]` và `/student/review`.

**Hai trạng thái:**

#### STATE A — Correct answer
```
Card: green gradient (#D1FAE5 → #A7F3D0), rounded-2xl
Content:
  - 🎉 emoji (48px)
  - "Chính xác!" (Source Serif 4, 22px, bold, #065F46)
  - Specific praise: "Giỏi lắm, con đã áp dụng đúng công thức" (14px, #047857)
  - Session correct count: "✅ {n} câu liên tiếp đúng" (pill badge, session-only*)
  - Solution shown: monospace block on green bg
  - Mastery nudge: 🌱 icon + "Thêm {n} câu đúng nữa là lên M{next}!" + progress bar
  - CTA: teal button "Câu tiếp theo →"
```

#### STATE B — Wrong answer
```
Card: yellow gradient (#FEF3C7 → #FDE68A), rounded-2xl
Content:
  - 💡 emoji (40px)
  - "Gần đúng rồi!" (Source Serif 4, 20px, bold, #92400E)
  - Specific hint: "Xem lại bước 2 — con nhầm b' với c'" (13px, #B45309)
  - Error tag badge: "E{code} — {description}" (small pill, amber bg)
  - Side-by-side comparison:
    Left (red bg): "Bài của con" — student's work with ❌ on wrong line
    Right (green bg): "Đáp án đúng" — correct solution with ✅
  - Encouragement: 💪 + specific praise for what was right + tip for next time
  - Dual CTA: "🔄 Thử lại" (amber) + "Câu tiếp →" (teal)
```

**⚠️ D17 compliance:** Session correct count (`n câu liên tiếp đúng`) is **session-only** — reset
when the session ends. NOT stored in DB. NOT persistent across sessions. NOT a streak.

**Data source cần thiết:**
- `correct: boolean` — from grading result (already exists in server action response)
- `studentWork: string` — student's submitted answer (already in action response)
- `correctAnswer: string` — from item data (already sent after grading)
- `errorCode?: string` — from grading (already computed by `grade.ts`)
- `errorDescription?: string` — from item's `mistakes` array (already in content JSON)
- `sessionCorrectStreak: number` — **client-side state only** (React useState, reset on mount)
- `masteryProgress` — from `systemMastery()` output (already computed)

**Không cần thêm bảng DB hay API mới.** Tất cả data đã có sẵn trong grading response và content.

## 4. Mini progress teaser (StudentHome)

**Thêm ở cuối trang StudentHome,** dưới TodayList:

```
Container: rounded-xl, surface bg, border
Content:
  - Gradient progress bar: linear-gradient(90deg, #34D399, #0D9488)
  - "{M3+ count}/{total units} bài đạt M3+" text
  - Link to ProgressMap: "Xem hành trình →" (teal, underline)
Width: 100% of content area
```

**Data source:** `state.units.filter(u => u.mastery.level >= 3).length` / `state.units.length`.

## 5. Fonts

Giữ nguyên 3 font families đã load:
- **Libre Franklin** → UI text, buttons, labels (display font)
- **Source Serif 4** → Headings, celebration text, greeting (body/display)
- **IBM Plex Mono** → Numbers, scores, math, code blocks

Không cần thêm font mới.

## 6. Files cần tạo/sửa (tóm tắt)

| File | Action | Mô tả |
|---|---|---|
| `src/app/globals.css` | Edit | Thêm `.student-theme` token override block |
| `src/app/student/layout.tsx` | Edit | Wrap `student-theme` class + teal gradient header |
| `src/app/student/page.tsx` | Edit | WeeklyGoal → SVG ring; ProgressMap → vertical path; TodayCard thêm emoji; thêm mini progress teaser |
| `src/app/student/components/question-feedback.tsx` | Create | QuestionFeedback component (correct + wrong states) |
| `src/app/student/learn/[unitId]/page.tsx` | Edit | Integrate QuestionFeedback after grading |
| `src/app/student/review/page.tsx` | Edit | Integrate QuestionFeedback after grading |

## 7. Không thay đổi

- **Tất cả server logic** (grading, mastery computation, review scheduling) — giữ nguyên 100%.
- **Database schema** — không thêm bảng, cột, hay migration.
- **Parent routes** (`/parent/*`) — giữ nguyên ink-blue theme.
- **Tutor routes** (`/tutor/*`) — giữ nguyên ink-blue theme.
- **Content format** — JSON files không đổi.
- **ConsentScreen** — giữ nguyên (nó đã đủ thân thiện).
- **D17** — tuyệt đối không thêm streak, leaderboard, hay bất kỳ gamification có tính cạnh tranh nào.

## 8. Thứ tự triển khai đề xuất

1. **CSS tokens** — thêm `.student-theme` block vào globals.css
2. **Student layout** — wrap class + gradient header
3. **WeeklyGoal** — SVG circle ring (independent component)
4. **ProgressMap** — vertical path with emoji nodes (independent component)
5. **TodayCard** — thêm emoji badges (nhỏ, nhanh)
6. **Mini progress teaser** — thêm cuối StudentHome
7. **QuestionFeedback** — component mới, integrate vào learn + review pages
8. **Test** — lint, build, e2e

Mỗi bước có thể commit riêng. Bước 1–6 không phụ thuộc nhau về logic (chỉ phụ thuộc CSS tokens ở bước 1).

## 9. Mockup reference

Design artifact: `https://claude.ai/artifact/LNFSgD23tfTxRb3Yi7vWbJ`

3 artboards:
- **StudentHome** — greeting header, SVG weekly goal ring, review cards with emoji badges, mini progress teaser
- **ProgressMap** — vertical path map with plant metaphor nodes, summary strip, gradient connectors
- **QuestionFeedback** — both correct (green celebration) and wrong (yellow gentle) states on one board
