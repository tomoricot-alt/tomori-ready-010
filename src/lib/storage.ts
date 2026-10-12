import type { Checks, Templates } from './model';
import { parseChecks, parseTemplates } from './model';

/** AsyncStorage と同じ形の最小インターフェース（テストでは差し替える） */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/** 持ち物テンプレートと、日付別のチェック状況は別のキーに分けて保存する */
export const TEMPLATES_KEY = 'tomori-ready-010:templates:v1';
export const CHECKS_KEY = 'tomori-ready-010:checks:v1';

export async function loadAll(store: KeyValueStore): Promise<{ templates: Templates; checks: Checks }> {
  const [t, c] = await Promise.all([safeGet(store, TEMPLATES_KEY), safeGet(store, CHECKS_KEY)]);
  return { templates: parseTemplates(t), checks: parseChecks(c) };
}

export async function saveTemplates(store: KeyValueStore, t: Templates): Promise<void> {
  await safeSet(store, TEMPLATES_KEY, JSON.stringify(t));
}

export async function saveChecks(store: KeyValueStore, c: Checks): Promise<void> {
  await safeSet(store, CHECKS_KEY, JSON.stringify(c));
}

async function safeGet(store: KeyValueStore, key: string): Promise<string | null> {
  try {
    return await store.getItem(key);
  } catch {
    return null;
  }
}

async function safeSet(store: KeyValueStore, key: string, value: string): Promise<void> {
  try {
    await store.setItem(key, value);
  } catch {
    // 保存できない環境（プライベートモード等）でも画面は動かし続ける
  }
}

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: async (k) => (k in data ? data[k] : null),
    setItem: async (k, v) => {
      data[k] = v;
    },
  };
}
