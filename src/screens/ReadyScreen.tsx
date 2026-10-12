import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Celebration } from '../components/Celebration';
import { CheckRow } from '../components/CheckRow';
import { ProgressCard } from '../components/ProgressCard';
import { formatDateJa, type DayTarget } from '../lib/date';
import type { AppState } from '../useAppState';
import { colors, radius } from '../theme';

const LABEL: Record<DayTarget, string> = { today: 'きょう', tomorrow: 'あした' };

export function ReadyScreen({ s, goSettings }: { s: AppState; goSettings: () => void }) {
  const { progress } = s;
  const [showParty, setShowParty] = useState(false);
  const prev = useRef<{ key: string; complete: boolean } | null>(null);

  // 「全部そろった」に変わった瞬間だけお祝いする（読み込み直後に既に完了済みなら出さない）
  useEffect(() => {
    if (!s.loaded) return;
    const p = prev.current;
    if (p && p.key === s.dateKey && !p.complete && progress.complete) setShowParty(true);
    prev.current = { key: s.dateKey, complete: progress.complete };
  }, [s.loaded, s.dateKey, progress.complete]);

  return (
    <View>
      <View style={styles.switch} accessibilityRole="tablist">
        {(['today', 'tomorrow'] as DayTarget[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => s.setTarget(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: s.target === t }}
            testID={`target-${t}`}
            style={[styles.switchBtn, s.target === t && styles.switchOn]}
          >
            <Text style={[styles.switchText, s.target === t && styles.switchTextOn]}>{LABEL[t]}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.date} testID="date-label">
        {LABEL[s.target]} {formatDateJa(s.dateKey)} の もちもの
      </Text>

      {!s.loaded ? (
        <Text style={styles.empty}>よみこみちゅう…</Text>
      ) : s.items.length === 0 ? (
        <View style={styles.emptyCard} testID="empty">
          <Text style={styles.emptyEmoji}>🌈</Text>
          <Text style={styles.emptyTitle}>この日は もちものが ないよ</Text>
          <Text style={styles.emptyText}>がっこうの ない日かも。もちものが あるときは「せってい」で ふやせるよ。</Text>
          <Pressable onPress={goSettings} accessibilityRole="button" style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>せっていを ひらく</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ProgressCard progress={progress} />
          {s.items.map((item) => (
            <CheckRow key={item.id} item={item} checked={s.checked.has(item.id)} onToggle={() => s.toggle(item.id)} />
          ))}
          {progress.done > 0 ? (
            <Pressable onPress={s.resetChecks} accessibilityRole="button" style={styles.reset} testID="reset-checks">
              <Text style={styles.resetText}>チェックを ぜんぶ はずす</Text>
            </Pressable>
          ) : null}
        </>
      )}

      {showParty ? <Celebration dayLabel={LABEL[s.target]} onClose={() => setShowParty(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  switch: { flexDirection: 'row', backgroundColor: colors.greenLight, borderRadius: radius.button + 4, padding: 5, marginBottom: 12 },
  switchBtn: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button },
  switchOn: { backgroundColor: colors.green },
  switchText: { fontSize: 22, fontWeight: '900', color: colors.greenDark },
  switchTextOn: { color: '#fff' },
  date: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.sub, fontSize: 18, marginTop: 30 },
  emptyCard: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 2, borderColor: colors.line, padding: 24, alignItems: 'center' },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: colors.greenDark, marginTop: 6 },
  emptyText: { fontSize: 16, color: colors.sub, marginTop: 8, textAlign: 'center', lineHeight: 24 },
  emptyBtn: { marginTop: 16, backgroundColor: colors.green, borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 26 },
  emptyBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  reset: { alignSelf: 'center', marginTop: 8, padding: 14 },
  resetText: { color: colors.sub, fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },
});
