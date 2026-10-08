import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { LanguageToggle } from '../../components/ui';
import { useLanguage } from '../../lib/language';
import { colors } from '../../lib/theme';

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { t } = useLanguage();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand600 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        headerRight: () => <LanguageToggle />,
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.gold200 },
        sceneStyle: { backgroundColor: colors.ivory },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('Parishath', 'పరిషత్'), tabBarLabel: t('Home', 'హోమ్'), tabBarIcon: ({ focused }) => <TabIcon glyph="🪷" focused={focused} /> }}
      />
      <Tabs.Screen
        name="activities"
        options={{ title: t('Activities', 'కార్యకలాపాలు'), tabBarIcon: ({ focused }) => <TabIcon glyph="📿" focused={focused} /> }}
      />
      <Tabs.Screen
        name="donate"
        options={{ title: t('Donate', 'విరాళం'), tabBarIcon: ({ focused }) => <TabIcon glyph="🙏" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('My Profile', 'నా ప్రొఫైల్'), tabBarLabel: t('Profile', 'ప్రొఫైల్'), tabBarIcon: ({ focused }) => <TabIcon glyph="👤" focused={focused} /> }}
      />
    </Tabs>
  );
}
