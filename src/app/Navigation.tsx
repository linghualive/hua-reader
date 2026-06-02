import React, { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
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

function TabItem({
  focused,
  routeName,
  onPress,
  primaryColor,
  mutedColor,
}: {
  focused: boolean;
  routeName: string;
  onPress: () => void;
  primaryColor: string;
  mutedColor: string;
}) {
  const config = TAB_CONFIG[routeName] ?? { label: routeName, icon: 'circle', iconFocused: 'circle' };
  const progress = useSharedValue(focused ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 15,
      stiffness: 200,
      mass: 0.8,
    });
  }, [focused]);

  const containerStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(progress.value, [0, 1], [14, 20]),
    backgroundColor: `rgba(${hexToRgb(primaryColor)}, ${interpolate(progress.value, [0, 1], [0, 0.12])})`,
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, 36]),
    opacity: progress.value,
    marginLeft: interpolate(progress.value, [0, 1], [0, 6]),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 0 : 0, { duration: 150 }),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0]) }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.tabItem, containerStyle]}>
        <MaterialCommunityIcons
          name={(focused ? config.iconFocused : config.icon) as any}
          size={21}
          color={focused ? primaryColor : mutedColor}
        />
        <Animated.View style={[styles.labelWrap, labelStyle]}>
          <Text style={[styles.tabLabel, { color: primaryColor }]} numberOfLines={1}>
            {config.label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, colorMode } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = colorMode !== 'light';

  return (
    <View style={[styles.tabBarOuter, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.tabBarShadow}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.tabBarBlur,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.75)' : 'rgba(255, 255, 255, 0.72)',
            },
          ]}
        >
          {state.routes.map((route, index) => (
            <TabItem
              key={route.key}
              focused={state.index === index}
              routeName={route.name}
              primaryColor={colors.primary}
              mutedColor={colors.onSurfaceVariant}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (state.index !== index && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          ))}
        </BlurView>
      </View>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  tabBarShadow: {
    ...Platform.select({
      android: { elevation: 16 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
    }),
    borderRadius: 26,
  },
  tabBarBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
    overflow: 'hidden',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  labelWrap: {
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
