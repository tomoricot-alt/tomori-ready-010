import { addDays, isDateKey, weekdayOf, type Weekday } from './date';

/** 持ち物（名前と絵文字）。どの曜日に持っていくかは Templates 側で持つ。 */
export interface Item {
  id: string;
  name: string;
  emoji: string;
}

/** 曜日別テンプレート：曜日ごとの持ち物ID（表示順） */
export interface Templates {
  version: 1;
  items: Item[];
  days: Record<Weekday, string[]>;
}

/** 日付別のチェック状況：日付キー → チェック済みの持ち物ID。テンプレートとは別に保存する。 */
export type Checks = Record<string, string[]>;

export const NAME_MAX = 20;
export const ITEM_MAX = 60;
/** この日数より古いチェック記録は自動で消す（保存データを増やさないため） */
export const CHECK_KEEP_DAYS = 60;

const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const SCHOOL_DAYS: Weekday[] = [1, 2, 3, 4, 5];

export const DEFAULT_ITEMS: Item[] = [
  { id: 'randoseru', name: 'ランドセル', emoji: '🎒' },
  { id: 'fudebako', name: 'ふでばこ', emoji: '✏️' },
  { id: 'kyokasho', name: '教科書', emoji: '📖' },
  { id: 'note', name: 'ノート', emoji: '📓' },
  { id: 'hankachi', name: 'ハンカチ', emoji: '🧣' },
  { id: 'tissue', name: 'ティッシュ', emoji: '🤧' },
  { id: 'suito', name: '水とう', emoji: '🥤' },
  { id: 'renrakucho', name: '連絡帳', emoji: '📒' },
];

/** 追加しやすい例（ワンタップで追加できる） */
export const SUGGESTED_ITEMS: Omit<Item, 'id'>[] = [
  { name: '習字セット', emoji: '🖌️' },
  { name: '絵の具セット', emoji: '🎨' },
  { name: '体操服', emoji: '👕' },
  { name: '上ばき', emoji: '👟' },
  { name: '図書の本', emoji: '📚' },
];

export const EMOJI_CHOICES = [
  '🎒', '✏️', '📖', '📓', '📒', '🧣', '🤧', '🥤',
  '🖌️', '🎨', '👕', '👟', '📚', '🎹', '🔔', '🧴',
  '🍙', '🧢', '☂️', '🧤', '🧪', '⚽', '🏊', '✂️',
];

export const DEFAULT_EMOJI = '⭐';

export function defaultTemplates(): Templates {
  const days = {} as Record<Weekday, string[]>;
  for (const d of ALL_DAYS) {
    days[d] = SCHOOL_DAYS.includes(d) ? DEFAULT_ITEMS.map((i) => i.id) : [];
  }
  return { version: 1, items: DEFAULT_ITEMS.map((i) => ({ ...i })), days };
}

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

let idCounter = 0;
export function newItemId(): string {
  idCounter += 1;
  return `i${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ---------- 持ち物の追加・編集・削除（すべて新しいオブジェクトを返す） ---------- */

/** 追加。名前が空・上限超えなら null。onDays の曜日のテンプレートにも入れる。 */
export function addItem(
  t: Templates,
  name: string,
  emoji: string,
  onDays: Weekday[],
  id: string = newItemId(),
): Templates | null {
  const n = cleanName(name);
  if (!n || t.items.length >= ITEM_MAX) return null;
  const days = { ...t.days };
  for (const d of onDays) days[d] = [...days[d], id];
  return { ...t, items: [...t.items, { id, name: n, emoji: emoji || DEFAULT_EMOJI }], days };
}

export function updateItem(t: Templates, id: string, name: string, emoji: string): Templates | null {
  const n = cleanName(name);
  if (!n || !t.items.some((i) => i.id === id)) return null;
  return {
    ...t,
    items: t.items.map((i) => (i.id === id ? { ...i, name: n, emoji: emoji || DEFAULT_EMOJI } : i)),
  };
}

/** 削除：すべての曜日のテンプレートからも消す（チェック記録は表示時に無視される） */
export function deleteItem(t: Templates, id: string): Templates {
  const days = {} as Record<Weekday, string[]>;
  for (const d of ALL_DAYS) days[d] = t.days[d].filter((x) => x !== id);
  return { ...t, items: t.items.filter((i) => i.id !== id), days };
}

/** 曜日ごとの持ち物設定：その曜日に持っていく／いかないを切り替える */
export function setItemOnDay(t: Templates, id: string, day: Weekday, on: boolean): Templates {
  const has = t.days[day].includes(id);
  if (on === has || !t.items.some((i) => i.id === id)) return t;
  return {
    ...t,
    days: { ...t.days, [day]: on ? [...t.days[day], id] : t.days[day].filter((x) => x !== id) },
  };
}

/* ---------- 日付ごとの表示・チェック ---------- */

/** ある日付に持っていく持ち物（その曜日のテンプレート順） */
export function itemsForDate(t: Templates, dateKey: string): Item[] {
  const byId = new Map(t.items.map((i) => [i.id, i]));
  return t.days[weekdayOf(dateKey)]
    .map((id) => byId.get(id))
    .filter((i): i is Item => i !== undefined);
}

export function checkedIdsForDate(checks: Checks, items: Item[], dateKey: string): Set<string> {
  const valid = new Set(items.map((i) => i.id));
  return new Set((checks[dateKey] ?? []).filter((id) => valid.has(id)));
}

/** 指定日の1項目のチェックを切り替える。他の日付のチェックには影響しない。 */
export function toggleCheck(checks: Checks, dateKey: string, itemId: string): Checks {
  const cur = checks[dateKey] ?? [];
  const next = cur.includes(itemId) ? cur.filter((x) => x !== itemId) : [...cur, itemId];
  return { ...checks, [dateKey]: next };
}

/** 指定日のチェックだけを全部はずす */
export function clearChecks(checks: Checks, dateKey: string): Checks {
  if (!(dateKey in checks)) return checks;
  const next = { ...checks };
  delete next[dateKey];
  return next;
}

export interface Progress {
  done: number;
  total: number;
  /** 0〜100 の整数（四捨五入）。持ち物が0個のときは 0 */
  percent: number;
  /** 持ち物が1つ以上あって、全部チェック済み */
  complete: boolean;
}

export function getProgress(items: Item[], checked: Set<string>): Progress {
  const total = items.length;
  const done = items.filter((i) => checked.has(i.id)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent, complete: total > 0 && done === total };
}

/** CHECK_KEEP_DAYS より古い日付のチェック記録を捨てる。today は日付キー。 */
export function pruneChecks(checks: Checks, today: string): Checks {
  const oldest = addDays(today, -CHECK_KEEP_DAYS);
  const next: Checks = {};
  for (const [k, v] of Object.entries(checks)) {
    if (k >= oldest && v.length > 0) next[k] = v;
  }
  return next;
}

/* ---------- 保存データの読み込み（壊れたデータでも落ちないように検証する） ---------- */

export function parseTemplates(raw: string | null): Templates {
  if (!raw) return defaultTemplates();
  try {
    const p = JSON.parse(raw) as Partial<Templates>;
    if (!p || p.version !== 1 || !Array.isArray(p.items) || typeof p.days !== 'object' || !p.days) {
      return defaultTemplates();
    }
    const seen = new Set<string>();
    const items: Item[] = [];
    for (const i of p.items) {
      if (!i || typeof i.id !== 'string' || typeof i.name !== 'string' || seen.has(i.id)) continue;
      const name = cleanName(i.name);
      if (!name) continue;
      seen.add(i.id);
      items.push({ id: i.id, name, emoji: typeof i.emoji === 'string' && i.emoji ? i.emoji : DEFAULT_EMOJI });
    }
    const days = {} as Record<Weekday, string[]>;
    for (const d of ALL_DAYS) {
      const list = (p.days as Record<string, unknown>)[String(d)];
      const ids = Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string' && seen.has(x)) : [];
      days[d] = Array.from(new Set(ids));
    }
    return { version: 1, items, days };
  } catch {
    return defaultTemplates();
  }
}

export function parseChecks(raw: string | null): Checks {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return {};
    const out: Checks = {};
    for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
      if (isDateKey(k) && Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === 'string');
    }
    return out;
  } catch {
    return {};
  }
}
