import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../theme';

const native = Platform.OS !== 'web';
const CONFETTI = ['🎉', '⭐', '✨', '🎈', '🌟', '🍀', '🎊'];

function Piece({ index, width, height }: { index: number; width: number; height: number }) {
  const y = useRef(new Animated.Value(0)).current;
  const cfg = useMemo(
    () => ({
      left: ((index * 53) % 100) / 100,
      delay: (index % 7) * 140,
      dur: 2200 + (index % 5) * 350,
      size: 24 + (index % 4) * 6,
      emoji: CONFETTI[index % CONFETTI.length],
    }),
    [index],
  );
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(y, { toValue: 1, duration: cfg.dur, delay: cfg.delay, easing: Easing.linear, useNativeDriver: native }),
    );
    loop.start();
    return () => loop.stop();
  }, [y, cfg]);
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: cfg.left * (width - 40),
        top: -40,
        fontSize: cfg.size,
        transform: [
          { translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, height + 60] }) },
          { rotate: y.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${index % 2 ? '' : '-'}360deg`] }) },
        ],
      }}
    >
      {cfg.emoji}
    </Animated.Text>
  );
}

/** ぜんぶチェックできたときのお祝い画面（紙ふぶき付き） */
export function Celebration({ onClose, dayLabel }: { onClose: () => void; dayLabel: string }) {
  const { width, height } = useWindowDimensions();
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 90, useNativeDriver: native }).start();
  }, [pop]);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
    <View style={styles.overlay} testID="celebration">
      {Array.from({ length: 22 }, (_, i) => (
        <Piece key={i} index={i} width={width} height={height} />
      ))}
      <Animated.View style={[styles.card, { transform: [{ scale: pop }] }]}>
        <Text style={styles.big}>🎉</Text>
        <Text style={styles.title}>ぜんぶ そろったよ！</Text>
        <Text style={styles.sub}>{dayLabel}の じゅんび、かんぺき！</Text>
        <Pressable onPress={onClose} accessibilityRole="button" style={styles.btn} testID="celebration-close">
          <Text style={styles.btnText}>やったー！</Text>
        </Pressable>
      </Animated.View>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(43,110,63,0.55)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 100 },
  card: { backgroundColor: colors.bg, borderRadius: 28, padding: 28, alignItems: 'center', marginHorizontal: 24, maxWidth: 420, width: '88%', borderWidth: 4, borderColor: colors.green },
  big: { fontSize: 72 },
  title: { fontSize: 25, fontWeight: '900', color: colors.greenDark, marginTop: 4, textAlign: 'center' },
  sub: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 8, textAlign: 'center' },
  btn: { marginTop: 22, backgroundColor: colors.green, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 40 },
  btnText: { color: '#fff', fontSize: 24, fontWeight: '900' },
});
