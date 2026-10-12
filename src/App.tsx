import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReadyScreen } from './screens/ReadyScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { colors } from './theme';
import { useAppState } from './useAppState';

type Tab = 'ready' | 'settings';

function Main() {
  const s = useAppState();
  const [tab, setTab] = useState<Tab>('ready');
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          <Text style={styles.logo}>🎒 TOMORI READY</Text>
          <Text style={styles.catch}>あしたの じゅんび、できたかな？</Text>
          {tab === 'ready' ? <ReadyScreen s={s} goSettings={() => setTab('settings')} /> : <SettingsScreen s={s} />}
        </View>
      </ScrollView>
      <View style={[styles.tabs, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
        {([['ready', '✅', 'じゅんび'], ['settings', '⚙️', 'せってい']] as const).map(([k, icon, label]) => (
          <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} testID={`tab-${k}`} style={[styles.tab, tab === k && styles.tabOn]}>
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text style={[styles.tabText, tab === k && styles.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : null) },
  scroll: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 24 },
  column: { width: '100%', maxWidth: 560 },
  logo: { fontSize: 26, fontWeight: '900', color: colors.greenDark, textAlign: 'center', marginTop: 16 },
  catch: { fontSize: 17, fontWeight: '800', color: colors.sub, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: colors.line, justifyContent: 'center', gap: 12, paddingTop: 8, paddingHorizontal: 12 },
  tab: { flex: 1, maxWidth: 260, minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  tabOn: { backgroundColor: colors.greenLight },
  tabIcon: { fontSize: 24 },
  tabText: { fontSize: 20, fontWeight: '900', color: colors.sub },
  tabTextOn: { color: colors.greenDark },
});
