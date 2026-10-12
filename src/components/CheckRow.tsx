import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Item } from '../lib/model';
import { colors, radius } from '../theme';

const native = Platform.OS !== 'web';

/** 大きなチェックボタン付きの持ち物1行。チェックするとポンッとはずむ。 */
export function CheckRow({ item, checked, onToggle }: { item: Item; checked: boolean; onToggle: () => void }) {
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!checked) return;
    pop.setValue(0.88);
    Animated.spring(pop, { toValue: 1, friction: 3, tension: 160, useNativeDriver: native }).start();
  }, [checked, pop]);

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={item.name}
      testID={`row-${item.name}`}
      style={({ pressed }) => [styles.row, checked && styles.rowDone, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.box, checked && styles.boxDone, { transform: [{ scale: pop }] }]}>
        {checked ? <Text style={styles.tick}>✓</Text> : null}
      </Animated.View>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={[styles.name, checked && styles.nameDone]} numberOfLines={2}>
        {item.name}
      </Text>
      {checked ? (
        <View style={styles.okTag}>
          <Text style={styles.okText}>OK!</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.line,
    marginBottom: 10,
  },
  rowDone: { backgroundColor: colors.greenLight, borderColor: colors.greenMid },
  pressed: { opacity: 0.85 },
  box: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.greenMid,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: colors.green, borderColor: colors.green },
  tick: { color: '#fff', fontSize: 32, fontWeight: '900', lineHeight: 38 },
  emoji: { fontSize: 34, marginLeft: 14, width: 44, textAlign: 'center' },
  name: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text, marginLeft: 6 },
  nameDone: { color: colors.sub, textDecorationLine: 'line-through' },
  okTag: { backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  okText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
