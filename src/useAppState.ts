import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultTarget, targetDateKey, toDateKey, type DayTarget, type Weekday } from './lib/date';
import {
  addItem, checkedIdsForDate, clearChecks, defaultTemplates, deleteItem, getProgress, itemsForDate,
  pruneChecks, setItemOnDay, toggleCheck, updateItem, type Checks, type Templates,
} from './lib/model';
import { loadAll, saveChecks, saveTemplates, type KeyValueStore } from './lib/storage';

/** 現在時刻。日付が変わっても（開きっぱなしでも）表示が切り替わるよう定期的に更新する。 */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, 15000);
    const doc = typeof document !== 'undefined' ? document : undefined;
    doc?.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      doc?.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return now;
}

export function useAppState(store: KeyValueStore = AsyncStorage) {
  const now = useNow();
  const [loaded, setLoaded] = useState(false);
  const [templates, setTemplates] = useState<Templates>(defaultTemplates);
  const [checks, setChecks] = useState<Checks>({});
  const [target, setTarget] = useState<DayTarget>(() => defaultTarget(new Date()));

  useEffect(() => {
    let alive = true;
    loadAll(store).then((s) => {
      if (!alive) return;
      setTemplates(s.templates);
      setChecks(pruneChecks(s.checks, toDateKey(new Date())));
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [store]);

  // 読み込みが終わるまで保存しない（初期値で上書きしないため）
  useEffect(() => {
    if (loaded) void saveTemplates(store, templates);
  }, [loaded, store, templates]);
  useEffect(() => {
    if (loaded) void saveChecks(store, checks);
  }, [loaded, store, checks]);

  const dateKey = targetDateKey(now, target);
  const items = useMemo(() => itemsForDate(templates, dateKey), [templates, dateKey]);
  const checked = useMemo(() => checkedIdsForDate(checks, items, dateKey), [checks, items, dateKey]);
  const progress = useMemo(() => getProgress(items, checked), [items, checked]);

  return {
    loaded, now, target, setTarget, dateKey, items, checked, progress, templates,
    toggle: useCallback((id: string) => setChecks((c) => toggleCheck(c, dateKey, id)), [dateKey]),
    resetChecks: useCallback(() => setChecks((c) => clearChecks(c, dateKey)), [dateKey]),
    add: useCallback((name: string, emoji: string, days: Weekday[]) => {
      let ok = false;
      setTemplates((t) => {
        const next = addItem(t, name, emoji, days);
        ok = next !== null;
        return next ?? t;
      });
      return ok;
    }, []),
    edit: useCallback((id: string, name: string, emoji: string) => setTemplates((t) => updateItem(t, id, name, emoji) ?? t), []),
    remove: useCallback((id: string) => setTemplates((t) => deleteItem(t, id)), []),
    setOnDay: useCallback((id: string, day: Weekday, on: boolean) => setTemplates((t) => setItemOnDay(t, id, day, on)), []),
  };
}

export type AppState = ReturnType<typeof useAppState>;
