import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';

import HomeScreen from '@/screens/home/HomeScreen';
import DiscoverScreen from '@/screens/discover/DiscoverScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

export type RootStackParamList = {
  Main: undefined;
  Reader: { articleId: number };
  Bookmarks: undefined;
  RecentlyRead: undefined;
  FeedManager: undefined;
  Settings: undefined;
};

export type DrawerParamList = {
  HomeDrawer: undefined;
  DiscoverDrawer: undefined;
  ProfileDrawer: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const DRAWER_ITEMS: { name: keyof DrawerParamList; label: string; icon: string; iconFocused: string }[] = [
  { name: 'HomeDrawer', label: '首页', icon: 'home-outline', iconFocused: 'home' },
  { name: 'DiscoverDrawer', label: '发现', icon: 'compass-outline', iconFocused: 'compass' },
  { name: 'ProfileDrawer', label: '我的', icon: 'account-outline', iconFocused: 'account' },
];

function CustomDrawerContent({ state, navigation }: DrawerContentComponentProps) {
  const { colors, colorMode } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = colorMode !== 'light';

  return (
    <View style={[styles.drawer, { backgroundColor: colors.surface, paddingTop: insets.top + 16 }]}>
      <View style={styles.drawerHeader}>
        <Text style={[styles.drawerTitle, { color: colors.onSurface }]}>华读</Text>
        <Text style={[styles.drawerSubtitle, { color: colors.onSurfaceVariant }]}>打破认知边界</Text>
      </View>

      <View style={[styles.drawerDivider, { backgroundColor: colors.outline + '20' }]} />

      <ScrollView style={styles.drawerMenu}>
        {DRAWER_ITEMS.map((item, index) => {
          const focused = state.index === index;
          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              style={[
                styles.drawerItem,
                focused && { backgroundColor: colors.primary + '12' },
              ]}
            >
              <MaterialCommunityIcons
                name={(focused ? item.iconFocused : item.icon) as any}
                size={22}
                color={focused ? colors.primary : colors.onSurfaceVariant}
              />
              <Text style={[styles.drawerItemText, { color: focused ? colors.primary : colors.onSurface }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function DrawerNavigator() {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 260, backgroundColor: colors.surface },
        overlayColor: 'rgba(0,0,0,0.4)',
      }}
    >
      <Drawer.Screen name="HomeDrawer" component={HomeScreen} />
      <Drawer.Screen name="DiscoverDrawer" component={DiscoverScreen} />
      <Drawer.Screen name="ProfileDrawer" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}

const LazyReader = React.lazy(() => import('@/screens/reader/ReaderScreen'));
const LazyBookmarks = React.lazy(() => import('@/screens/profile/BookmarksScreen'));
const LazyRecentlyRead = React.lazy(() => import('@/screens/profile/RecentScreen'));
const LazyFeedManager = React.lazy(() => import('@/screens/profile/FeedManagerScreen'));
const LazySettings = React.lazy(() => import('@/screens/profile/SettingsScreen'));

function wrap(Comp: React.LazyExoticComponent<any>) {
  return function Wrapper(props: any) {
    return (<React.Suspense fallback={null}><Comp {...props} /></React.Suspense>);
  };
}

export function Navigation() {
  const { colors } = useTheme();
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="Main" component={DrawerNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Reader" component={wrap(LazyReader)} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="Bookmarks" component={wrap(LazyBookmarks)} options={{ headerShown: true, title: '我的收藏' }} />
        <Stack.Screen name="RecentlyRead" component={wrap(LazyRecentlyRead)} options={{ headerShown: true, title: '最近阅读' }} />
        <Stack.Screen name="FeedManager" component={wrap(LazyFeedManager)} options={{ headerShown: true, title: '订阅源管理' }} />
        <Stack.Screen name="Settings" component={wrap(LazySettings)} options={{ headerShown: true, title: '设置' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawer: { flex: 1, paddingHorizontal: 12 },
  drawerHeader: { paddingHorizontal: 16, paddingBottom: 16 },
  drawerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  drawerSubtitle: { fontSize: 13, marginTop: 4 },
  drawerDivider: { height: StyleSheet.hairlineWidth, marginBottom: 8 },
  drawerMenu: { flex: 1 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, marginBottom: 2 },
  drawerItemText: { fontSize: 15, fontWeight: '500' },
});
