// Plant metaphor for mastery levels on student screens (spec 2026-10-05, U3: M0 is 🌰, not 🔒).
export const MASTERY = [
  { emoji: "🌰", label: "Chưa bắt đầu", from: "#F1F5F9", to: "#E2E8F0", ring: "#CBD5E1", text: "#475569" },
  { emoji: "🌱", label: "Mới bắt đầu", from: "#EDE9FE", to: "#DDD6FE", ring: "#8B5CF6", text: "#6D28D9" },
  { emoji: "🌿", label: "Đang tiến", from: "#DBEAFE", to: "#BFDBFE", ring: "#2563EB", text: "#1D4ED8" },
  { emoji: "🌳", label: "Đạt", from: "#CCFBF1", to: "#99F6E4", ring: "#0D9488", text: "#0F766E" },
  { emoji: "⭐", label: "Đã vững", from: "#FEF3C7", to: "#FDE68A", ring: "#F59E0B", text: "#92400E" },
] as const;

export const masteryOf = (level: number) => MASTERY[Math.max(0, Math.min(4, level))];
