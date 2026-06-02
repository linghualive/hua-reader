import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeContext';

import HomeScreen from '@/screens/home/HomeScreen';
import DiscoverScreen from '@/screens/discover/DiscoverScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

export type RootStackParamList = {
  Main: undefined;
  Reader: { articleId: number };
  Bookmarks: undefined;
  FeedManager: undefined;
  Settings: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  DiscoverTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_CONFIG: Record<string, { label: string; icon: string; iconFocused: string }> = {
  HomeTab: { label: '首页', icon: 'home-outline', iconFocused: 'home' },
  DiscoverTab: { label: '发现', icon: 'compass-outline', iconFocused: 'compass' },
  ProfileTab: { label: '我的', icon: 'account-outline', iconFocused: 'account' },
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, colorMode } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = colorMode !== 'light';

  return (
    <View style={[styles.tabBarOuter, { bottom: Math.max(insets.bottom, 16) }]}>
      <View
        style={[
          styles.tabBarContainer,
          {
            backgroundColor: isDark ? 'rgba(28, 28, 30, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? { label: route.name, icon: 'circle', iconFocused: 'circle' };

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (state.index !== index && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={[
                styles.tabItem,
                focused && { backgroundColor: colors.primary + '15' },
              ]}
            >
              <MaterialCommunityIcons
                name={(focused ? config.iconFocused : config.icon) as any}
                size={21}
                color={focused ? colors.primary : colors.onSurfaceVariant}
              />
              {focused && (
                <Text style={[styles.tabLabel, { color: colors.primary }]}>
                  {config.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute', height: 0, overflow: 'hidden', borderTopWidth: 0, elevation: 0 },
        tabBarShowLabel: false,
      }}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="DiscoverTab" component={DiscoverScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const LazyReader = React.lazy(() => import('@/screens/reader/ReaderScreen'));
const LazyBookmarks = React.lazy(() => import('@/screens/profile/BookmarksScreen'));
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
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Reader" component={wrap(LazyReader)} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="Bookmarks" component={wrap(LazyBookmarks)} options={{ headerShown: true, title: '我的收藏' }} />
        <Stack.Screen name="FeedManager" component={wrap(LazyFeedManager)} options={{ headerShown: true, title: '订阅源管理' }} />
        <Stack.Screen name="Settings" component={wrap(LazySettings)} options={{ headerShown: true, title: '设置' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 26,
    gap: 4,
    ...Platform.select({
      android: { elevation: 12 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    }),
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
