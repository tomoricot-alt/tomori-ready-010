import { StyleSheet, Text, View } from 'react-native';
import type { Progress } from '../lib/model';
import { colors, radius } from '../theme';

function message(p: Progress): string {
  if (p.total === 0) return '';
  if (p.complete) return 'ぜんぶ そろったよ！すごい！';
  if (p.done === 0) return 'ひとつずつ たしかめよう';
  if (p.percent >= 50) return 'もうすこし！いいちょうし';
  return 'いいね！つぎは どれかな？';
}

/** 準備できた数と達成率。バーで一目で分かる。 */
export function ProgressCard({ progress }: { progress: Progress }) {
  const { done, total, percent, complete } = progress;
  return (
    <View style={[styles.card, complete && styles.cardDone]} testID="progress-card">
      <View style={styles.top}>
        <Text style={styles.count} testID="progress-count">
          {done}
          <Text style={styles.countSub}> / {total} こ じゅんびOK</Text>
        </Text>
        <Text style={styles.percent} testID="progress-percent">
          {percent}%
        </Text>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
        <View style={[styles.fill, { width: `${percent}%` }, complete && styles.fillDone]} />
      </View>
      {message(progress) ? <Text style={styles.msg}>{complete ? '🎉 ' : ''}{message(progress)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 2, borderColor: colors.line, padding: 16, marginBottom: 14 },
  cardDone: { backgroundColor: colors.greenLight, borderColor: colors.green },
  top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  count: { fontSize: 34, fontWeight: '900', color: colors.greenDark },
  countSub: { fontSize: 16, fontWeight: '700', color: colors.sub },
  percent: { fontSize: 28, fontWeight: '900', color: colors.green },
  track: { height: 22, borderRadius: 11, backgroundColor: colors.greenLight, overflow: 'hidden', marginTop: 8, borderWidth: 1, borderColor: colors.greenMid },
  fill: { height: '100%', backgroundColor: colors.green, borderRadius: 11 },
  fillDone: { backgroundColor: colors.greenDark },
  msg: { marginTop: 10, fontSize: 17, fontWeight: '800', color: colors.greenDark, textAlign: 'center' },
});
