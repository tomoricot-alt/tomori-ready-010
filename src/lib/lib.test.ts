import { describe, expect, it } from 'vitest';
import { addDays, defaultTarget, formatDateJa, targetDateKey, toDateKey, weekdayOf } from './date';
import {
  CHECK_KEEP_DAYS, addItem, checkedIdsForDate, clearChecks, defaultTemplates, deleteItem,
  getProgress, itemsForDate, parseChecks, parseTemplates, pruneChecks, setItemOnDay,
  toggleCheck, updateItem,
} from './model';
import { CHECKS_KEY, TEMPLATES_KEY, createMemoryStore, loadAll, saveChecks, saveTemplates } from './storage';

// 2026-10-12 は月曜日
const MON = '2026-10-12';

describe('持ち物の追加・編集・削除', () => {
  it('初期サンプル8個が月〜金に入っている', () => {
    const t = defaultTemplates();
    expect(t.items.map((i) => i.name)).toEqual(
      ['ランドセル', 'ふでばこ', '教科書', 'ノート', 'ハンカチ', 'ティッシュ', '水とう', '連絡帳']);
    expect(t.days[1]).toHaveLength(8);
    expect(t.days[5]).toHaveLength(8);
    expect(t.days[0]).toHaveLength(0);
    expect(t.days[6]).toHaveLength(0);
  });

  it('追加：指定した曜日にだけ入る。空の名前は追加できない', () => {
    const t = addItem(defaultTemplates(), ' 習字セット ', '🖌️', [2], 'shuji')!;
    expect(t.items.at(-1)).toEqual({ id: 'shuji', name: '習字セット', emoji: '🖌️' });
    expect(t.days[2]).toContain('shuji');
    expect(t.days[1]).not.toContain('shuji');
    expect(addItem(defaultTemplates(), '   ', '⭐', [1])).toBeNull();
  });

  it('編集：名前と絵文字が変わる。空にはできない', () => {
    const t = updateItem(defaultTemplates(), 'suito', 'お茶', '🍵')!;
    expect(t.items.find((i) => i.id === 'suito')).toEqual({ id: 'suito', name: 'お茶', emoji: '🍵' });
    expect(updateItem(defaultTemplates(), 'suito', '', '🍵')).toBeNull();
  });

  it('削除：全曜日から消える', () => {
    const t = deleteItem(defaultTemplates(), 'note');
    expect(t.items.some((i) => i.id === 'note')).toBe(false);
    for (const d of [0, 1, 2, 3, 4, 5, 6] as const) expect(t.days[d]).not.toContain('note');
  });
});

describe('曜日別テンプレート', () => {
  it('曜日ごとに設定でき、他の曜日に影響しない', () => {
    let t = addItem(defaultTemplates(), '体操服', '👕', [])!;
    const id = t.items.at(-1)!.id;
    t = setItemOnDay(t, id, 3, true);
    expect(itemsForDate(t, '2026-10-14').map((i) => i.name)).toContain('体操服'); // 水
    expect(itemsForDate(t, '2026-10-13').map((i) => i.name)).not.toContain('体操服'); // 火
    t = setItemOnDay(t, id, 3, false);
    expect(itemsForDate(t, '2026-10-14').map((i) => i.name)).not.toContain('体操服');
  });

  it('テンプレートの保存→読み込みで同じ内容に戻る', async () => {
    const store = createMemoryStore();
    const t = setItemOnDay(defaultTemplates(), 'note', 6, true);
    await saveTemplates(store, t);
    expect((await loadAll(store)).templates).toEqual(t);
  });
});

describe('チェックと達成率', () => {
  const items = itemsForDate(defaultTemplates(), MON);

  it('チェックを付ける／はずす', () => {
    let c = toggleCheck({}, MON, 'note');
    expect(checkedIdsForDate(c, items, MON).has('note')).toBe(true);
    c = toggleCheck(c, MON, 'note');
    expect(checkedIdsForDate(c, items, MON).has('note')).toBe(false);
  });

  it('達成率の計算（四捨五入）', () => {
    const p = (n: number) => getProgress(items, new Set(items.slice(0, n).map((i) => i.id)));
    expect(p(0)).toEqual({ done: 0, total: 8, percent: 0, complete: false });
    expect(p(3).percent).toBe(38); // 37.5 → 38
    expect(p(5).percent).toBe(63); // 62.5 → 63
    expect(p(7).complete).toBe(false);
    expect(p(8)).toEqual({ done: 8, total: 8, percent: 100, complete: true });
  });

  it('持ち物0個のときはお祝いしない', () => {
    expect(getProgress([], new Set())).toEqual({ done: 0, total: 0, percent: 0, complete: false });
  });

  it('削除済みの項目のチェックは数えない', () => {
    const t = deleteItem(defaultTemplates(), 'note');
    const its = itemsForDate(t, MON);
    const done = checkedIdsForDate({ [MON]: ['note', 'suito'] }, its, MON);
    expect(getProgress(its, done).done).toBe(1);
  });

  it('その日のチェックだけをリセットできる', () => {
    const c = clearChecks({ [MON]: ['note'], '2026-10-13': ['note'] }, MON);
    expect(c).toEqual({ '2026-10-13': ['note'] });
  });
});

describe('日付の切り替え', () => {
  it('きょう／あしたの日付キー', () => {
    const now = new Date(2026, 9, 12, 20, 0);
    expect(targetDateKey(now, 'today')).toBe('2026-10-12');
    expect(targetDateKey(now, 'tomorrow')).toBe('2026-10-13');
  });

  it('日曜日の「あした」は月曜日', () => {
    const sunday = new Date(2026, 9, 11, 19, 0);
    expect(weekdayOf(toDateKey(sunday))).toBe(0);
    const key = targetDateKey(sunday, 'tomorrow');
    expect(key).toBe(MON);
    expect(weekdayOf(key)).toBe(1);
    expect(itemsForDate(defaultTemplates(), key)).toHaveLength(8);
    expect(itemsForDate(defaultTemplates(), toDateKey(sunday))).toHaveLength(0);
  });

  it('月末・年末をまたぐ', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(formatDateJa('2026-10-13')).toBe('10月13日（火）');
  });

  it('初期表示：お昼前はきょう、お昼以降はあした', () => {
    expect(defaultTarget(new Date(2026, 9, 12, 8))).toBe('today');
    expect(defaultTarget(new Date(2026, 9, 12, 19))).toBe('tomorrow');
  });
});

describe('日付ごとのチェック状態の分離', () => {
  it('前日のチェックが翌日に引き継がれない', () => {
    const items = itemsForDate(defaultTemplates(), MON);
    const c = toggleCheck(toggleCheck({}, MON, 'note'), MON, 'suito');
    expect(checkedIdsForDate(c, items, MON).size).toBe(2);
    expect(checkedIdsForDate(c, items, addDays(MON, 1)).size).toBe(0);
    // 翌日をチェックしても月曜は変わらない
    const c2 = toggleCheck(c, addDays(MON, 1), 'note');
    expect(c2[MON]).toEqual(['note', 'suito']);
  });

  it('チェック状況はテンプレートと別のキーに保存される', async () => {
    const store = createMemoryStore();
    await saveTemplates(store, defaultTemplates());
    await saveChecks(store, { [MON]: ['note'] });
    expect(Object.keys(store.data).sort()).toEqual([CHECKS_KEY, TEMPLATES_KEY].sort());
    expect(JSON.parse(store.data[TEMPLATES_KEY])).not.toHaveProperty(MON);
    expect(JSON.parse(store.data[CHECKS_KEY])).toEqual({ [MON]: ['note'] });
  });

  it('古い記録は自動で消える', () => {
    const old = addDays(MON, -(CHECK_KEEP_DAYS + 1));
    expect(pruneChecks({ [old]: ['a'], [MON]: ['a'] }, MON)).toEqual({ [MON]: ['a'] });
  });
});

describe('再読み込み後の保存と壊れたデータ', () => {
  it('保存した内容を新しい読み込みで復元できる', async () => {
    const store = createMemoryStore();
    const t = addItem(defaultTemplates(), '図書の本', '📚', [4], 'book')!;
    await saveTemplates(store, t);
    await saveChecks(store, toggleCheck({}, MON, 'book'));
    const loaded = await loadAll(store);
    expect(loaded.templates).toEqual(t);
    expect(loaded.checks).toEqual({ [MON]: ['book'] });
  });

  it('保存データが無い／壊れていると初期状態になる', async () => {
    expect((await loadAll(createMemoryStore())).templates).toEqual(defaultTemplates());
    const bad = createMemoryStore({ [TEMPLATES_KEY]: '{oops', [CHECKS_KEY]: '[1,2]' });
    const l = await loadAll(bad);
    expect(l.templates).toEqual(defaultTemplates());
    expect(l.checks).toEqual({});
  });

  it('存在しない持ち物IDは読み込み時に取り除く', () => {
    const raw = JSON.stringify({ version: 1, items: [{ id: 'a', name: 'あ', emoji: '⭐' }], days: { 1: ['a', 'zzz'] } });
    expect(parseTemplates(raw).days[1]).toEqual(['a']);
    expect(parseChecks('{"bad":["a"],"2026-10-12":["a"]}')).toEqual({ '2026-10-12': ['a'] });
  });
});
