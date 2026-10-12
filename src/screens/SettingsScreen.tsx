import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { WEEKDAY_LABELS, WEEK_ORDER, type Weekday } from '../lib/date';
import { EMOJI_CHOICES, NAME_MAX, SUGGESTED_ITEMS, type Item } from '../lib/model';
import type { AppState } from '../useAppState';
import { colors, radius } from '../theme';

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <View style={styles.emojiGrid}>
      {EMOJI_CHOICES.map((e) => (
        <Pressable
          key={e}
          onPress={() => onChange(e)}
          accessibilityRole="button"
          accessibilityLabel={`絵文字 ${e}`}
          style={[styles.emojiBtn, value === e && styles.emojiBtnOn]}
        >
          <Text style={styles.emojiText}>{e}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ItemEditor({ item, onSave, onCancel }: { item: Item; onSave: (name: string, emoji: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(item.name);
  const [emoji, setEmoji] = useState(item.emoji);
  return (
    <View style={styles.editor}>
      <TextInput value={name} onChangeText={setName} maxLength={NAME_MAX} style={styles.input} placeholder="もちものの なまえ" testID="edit-name" />
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <View style={styles.btnRow}>
        <Pressable onPress={() => name.trim() && onSave(name, emoji)} accessibilityRole="button" style={[styles.btn, !name.trim() && styles.btnOff]} testID="edit-save">
          <Text style={styles.btnText}>ほぞんする</Text>
        </Pressable>
        <Pressable onPress={onCancel} accessibilityRole="button" style={styles.btnGhost}>
          <Text style={styles.btnGhostText}>やめる</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SettingsScreen({ s }: { s: AppState }) {
  const [day, setDay] = useState<Weekday>(1);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const onDay = new Set(s.templates.days[day]);
  const have = new Set(s.templates.items.map((i) => i.name));

  const add = (n: string, e: string) => {
    if (s.add(n, e, [day])) {
      setName('');
      setEmoji('⭐');
    }
  };

  return (
    <View>
      <Text style={styles.h}>① 曜日を えらぶ</Text>
      <View style={styles.days}>
        {WEEK_ORDER.map((d) => (
          <Pressable
            key={d}
            onPress={() => setDay(d)}
            accessibilityRole="tab"
            accessibilityState={{ selected: day === d }}
            testID={`day-${WEEKDAY_LABELS[d]}`}
            style={[styles.dayBtn, day === d && styles.dayOn]}
          >
            <Text style={[styles.dayText, day === d && styles.dayTextOn]}>{WEEKDAY_LABELS[d]}</Text>
            <Text style={[styles.dayCount, day === d && styles.dayTextOn]}>{s.templates.days[d].length}こ</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.h}>② {WEEKDAY_LABELS[day]}曜日に もっていくもの</Text>
      <Text style={styles.hint}>●が ついているものが {WEEKDAY_LABELS[day]}曜日の もちものだよ。タップで かえられるよ。</Text>
      {s.templates.items.length === 0 ? <Text style={styles.hint}>もちものが ないよ。下から ふやしてね。</Text> : null}
      {s.templates.items.map((item) => {
        const on = onDay.has(item.id);
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.itemRow}>
              <Pressable
                onPress={() => s.setOnDay(item.id, day, !on)}
                accessibilityRole="switch"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${item.name}を${WEEKDAY_LABELS[day]}曜日にもっていく`}
                testID={`toggle-${item.name}`}
                style={[styles.toggle, on && styles.toggleOn]}
              >
                <Text style={[styles.toggleText, on && styles.toggleTextOn]}>{on ? 'あり' : 'なし'}</Text>
              </Pressable>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Pressable onPress={() => { setEditing(editing === item.id ? null : item.id); setConfirmDel(null); }} accessibilityRole="button" accessibilityLabel={`${item.name}をなおす`} testID={`edit-${item.name}`} style={styles.iconBtn}>
                <Text style={styles.iconText}>✏️</Text>
              </Pressable>
              <Pressable onPress={() => { setConfirmDel(confirmDel === item.id ? null : item.id); setEditing(null); }} accessibilityRole="button" accessibilityLabel={`${item.name}をけす`} testID={`delete-${item.name}`} style={styles.iconBtn}>
                <Text style={styles.iconText}>🗑️</Text>
              </Pressable>
            </View>
            {editing === item.id ? (
              <ItemEditor item={item} onSave={(n, e) => { s.edit(item.id, n, e); setEditing(null); }} onCancel={() => setEditing(null)} />
            ) : null}
            {confirmDel === item.id ? (
              <View style={styles.confirm}>
                <Text style={styles.confirmText}>「{item.name}」を ぜんぶの曜日から けすよ。いいかな？</Text>
                <View style={styles.btnRow}>
                  <Pressable onPress={() => { s.remove(item.id); setConfirmDel(null); }} accessibilityRole="button" style={[styles.btn, styles.btnDanger]} testID="delete-confirm">
                    <Text style={styles.btnText}>けす</Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirmDel(null)} accessibilityRole="button" style={styles.btnGhost}>
                    <Text style={styles.btnGhostText}>やめる</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      <Text style={styles.h}>③ もちものを ふやす</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>{WEEKDAY_LABELS[day]}曜日に ふやすよ。ほかの曜日は ②で えらべるよ。</Text>
        <View style={styles.chips}>
          {SUGGESTED_ITEMS.filter((x) => !have.has(x.name)).map((x) => (
            <Pressable key={x.name} onPress={() => add(x.name, x.emoji)} accessibilityRole="button" testID={`suggest-${x.name}`} style={styles.chip}>
              <Text style={styles.chipText}>{x.emoji} {x.name} ＋</Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={name} onChangeText={setName} maxLength={NAME_MAX} style={styles.input} placeholder="じぶんで いれる（れい：リコーダー）" testID="new-name" onSubmitEditing={() => add(name, emoji)} />
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <Pressable onPress={() => add(name, emoji)} accessibilityRole="button" style={[styles.btn, !name.trim() && styles.btnOff]} testID="new-add">
          <Text style={styles.btnText}>{emoji} ふやす</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        ※ データは この端末の ブラウザの中だけに のこるよ。ブラウザの「サイトデータ」を けすと、せっていも なくなるから ちゅうい！
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 20, fontWeight: '900', color: colors.greenDark, marginTop: 16, marginBottom: 8 },
  hint: { fontSize: 15, color: colors.sub, marginBottom: 10, lineHeight: 22 },
  days: { flexDirection: 'row', gap: 6 },
  dayBtn: { flex: 1, minHeight: 60, borderRadius: radius.button, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: colors.green, borderColor: colors.green },
  dayText: { fontSize: 22, fontWeight: '900', color: colors.text },
  dayCount: { fontSize: 11, fontWeight: '700', color: colors.sub },
  dayTextOn: { color: '#fff' },
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 2, borderColor: colors.line, padding: 12, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  toggle: { width: 64, height: 48, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: '#F1EEE2', alignItems: 'center', justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.green, borderColor: colors.green },
  toggleText: { fontSize: 16, fontWeight: '900', color: colors.sub },
  toggleTextOn: { color: '#fff' },
  itemEmoji: { fontSize: 28, marginLeft: 10, width: 38, textAlign: 'center' },
  itemName: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 22 },
  editor: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  confirm: { marginTop: 10, backgroundColor: '#FDECEA', borderRadius: 12, padding: 12 },
  confirmText: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: { borderWidth: 2, borderColor: colors.greenMid, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, backgroundColor: '#fff', color: colors.text, marginBottom: 10 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  emojiBtnOn: { borderColor: colors.green, backgroundColor: colors.greenLight },
  emojiText: { fontSize: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: colors.yellow, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  chipText: { fontSize: 16, fontWeight: '800', color: colors.text },
  btnRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  btn: { backgroundColor: colors.green, borderRadius: radius.button, minHeight: 52, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  btnOff: { opacity: 0.4 },
  btnDanger: { backgroundColor: colors.warn },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  btnGhost: { minHeight: 52, paddingHorizontal: 18, justifyContent: 'center' },
  btnGhostText: { color: colors.sub, fontSize: 17, fontWeight: '800' },
  note: { marginTop: 18, fontSize: 14, color: colors.sub, lineHeight: 21, textAlign: 'center' },
});
