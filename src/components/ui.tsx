import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useLanguage } from '../lib/language';
import { colors } from '../lib/theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  if (!scroll) return <View style={styles.screen}>{children}</View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <View style={styles.titleWrap}>
      <Text style={styles.title}>{children}</Text>
      <View style={styles.rule} />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        (disabled || loading) && styles.buttonDisabled,
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.white : colors.brand600} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? colors.white : colors.brand600 }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.subtle} style={[styles.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }]} {...props} />
    </View>
  );
}

export function Banner({ type, text }: { type: 'error' | 'success'; text: string }) {
  if (!text) return null;
  const error = type === 'error';
  return (
    <View style={[styles.banner, error ? styles.bannerError : styles.bannerSuccess]}>
      <Text style={{ color: error ? colors.vermilion700 : colors.brand700 }}>{text}</Text>
    </View>
  );
}

export function Loading() {
  const { t } = useLanguage();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.brand600} />
      <Text style={{ color: colors.brand600, marginTop: 8 }}>{t('Loading...', 'లోడ్ అవుతోంది...')}</Text>
    </View>
  );
}

// EN / తెలుగు switch, shown in every screen header
export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <View style={styles.toggle}>
      {(['en', 'te'] as const).map((lang) => (
        <Pressable
          key={lang}
          accessibilityRole="button"
          accessibilityState={{ selected: language === lang }}
          onPress={() => setLanguage(lang)}
          style={[styles.toggleItem, language === lang && styles.toggleItemActive]}
        >
          <Text style={[styles.toggleText, language === lang && { color: colors.brand600 }]}>{lang === 'en' ? 'EN' : 'తెలుగు'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Chip({ label, selected, onPress, dotColor }: { label: string; selected: boolean; onPress: () => void; dotColor?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={{ color: selected ? colors.white : colors.brand700, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  screenContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.ivory },
  titleWrap: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, color: colors.brand600, fontWeight: '600', textAlign: 'center' },
  rule: { width: 96, height: 2, backgroundColor: colors.gold500, marginTop: 10 },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.gold200,
    borderWidth: 1,
    borderTopWidth: 4,
    borderTopColor: colors.gold500,
    borderRadius: 6,
    padding: 16,
    marginBottom: 14,
  },
  button: { borderRadius: 6, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center', marginTop: 6 },
  buttonPrimary: { backgroundColor: colors.brand600 },
  buttonSecondary: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.brand600 },
  buttonDisabled: { backgroundColor: '#9ca3af', borderColor: '#9ca3af' },
  buttonText: { fontWeight: '600', fontSize: 16 },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gold200,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  banner: { padding: 12, borderRadius: 6, borderWidth: 1, marginBottom: 14 },
  bannerError: { backgroundColor: colors.vermilion50, borderColor: colors.vermilion200 },
  bannerSuccess: { backgroundColor: colors.brand50, borderColor: colors.brand100 },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: colors.gold500, borderRadius: 16, overflow: 'hidden', marginRight: 12 },
  toggleItem: { paddingHorizontal: 10, paddingVertical: 4 },
  toggleItemActive: { backgroundColor: colors.gold500 },
  toggleText: { color: colors.gold100, fontWeight: '600', fontSize: 13 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gold200,
    backgroundColor: colors.white,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.2)' },
  muted: { color: colors.muted, lineHeight: 21 },
});
