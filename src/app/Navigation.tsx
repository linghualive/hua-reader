import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, colorMode } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = colorMode !== 'light';

  return (
    <View style={[styles.tabBarOuter, { bottom: Math.max(insets.bottom, 12) }]}>
      <View
        style={[
          styles.tabBarContainer,
          {
            backgroundColor: isDark ? 'rgba(30, 30, 34, 0.88)' : 'rgba(255, 255, 255, 0.82)',
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
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={[
                styles.tabItem,
                focused && [styles.tabItemFocused, { backgroundColor: colors.primary + '18' }],
              ]}
            >
              <MaterialCommunityIcons
                name={(focused ? config.iconFocused : config.icon) as any}
                size={22}
                color={focused ? colors.primary : colors.onSurfaceVariant}
              />
              {focused && (
                <Text style={[styles.tabLabel, { color: colors.primary }]}>{config.label}</Text>
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

function ReaderScreenWrapper(props: any) {
  return (<React.Suspense fallback={null}><LazyReader {...props} /></React.Suspense>);
}
function BookmarksScreenWrapper(props: any) {
  return (<React.Suspense fallback={null}><LazyBookmarks {...props} /></React.Suspense>);
}
function FeedManagerScreenWrapper(props: any) {
  return (<React.Suspense fallback={null}><LazyFeedManager {...props} /></React.Suspense>);
}
function SettingsScreenWrapper(props: any) {
  return (<React.Suspense fallback={null}><LazySettings {...props} /></React.Suspense>);
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
        <Stack.Screen name="Reader" component={ReaderScreenWrapper} options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="Bookmarks" component={BookmarksScreenWrapper} options={{ headerShown: true, title: '我的收藏' }} />
        <Stack.Screen name="FeedManager" component={FeedManagerScreenWrapper} options={{ headerShown: true, title: '订阅源管理' }} />
        <Stack.Screen name="Settings" component={SettingsScreenWrapper} options={{ headerShown: true, title: '设置' }} />
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
    borderRadius: 28,
    borderWidth: 1,
    gap: 4,
    ...Platform.select({
      android: {
        elevation: 12,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
  },
  tabItemFocused: {
    paddingHorizontal: 18,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
