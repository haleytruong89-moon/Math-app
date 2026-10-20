// T8: the tutor's ordered list of focus KUs for one student. Pure.
export const PRIORITY_MAX = 20;

export function editPriorityList(list: string[], op: "toggle" | "up" | "down", unitId: string): string[] {
  const i = list.indexOf(unitId);
  if (op === "toggle") return i >= 0 ? list.filter((x) => x !== unitId) : list.length >= PRIORITY_MAX ? list : [...list, unitId];
  const j = op === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}
