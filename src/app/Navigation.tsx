import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outline,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{
          tabBarLabel: '发现',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="compass" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Lazy-loaded screen imports (will be replaced in later tasks)
const LazyReader = React.lazy(() => import('@/screens/reader/ReaderScreen'));
const LazyBookmarks = React.lazy(() => import('@/screens/profile/BookmarksScreen'));
const LazyFeedManager = React.lazy(() => import('@/screens/profile/FeedManagerScreen'));
const LazySettings = React.lazy(() => import('@/screens/profile/SettingsScreen'));

function ReaderScreenWrapper(props: any) {
  return (
    <React.Suspense fallback={null}>
      <LazyReader {...props} />
    </React.Suspense>
  );
}

function BookmarksScreenWrapper(props: any) {
  return (
    <React.Suspense fallback={null}>
      <LazyBookmarks {...props} />
    </React.Suspense>
  );
}

function FeedManagerScreenWrapper(props: any) {
  return (
    <React.Suspense fallback={null}>
      <LazyFeedManager {...props} />
    </React.Suspense>
  );
}

function SettingsScreenWrapper(props: any) {
  return (
    <React.Suspense fallback={null}>
      <LazySettings {...props} />
    </React.Suspense>
  );
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
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Reader"
          component={ReaderScreenWrapper}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Bookmarks"
          component={BookmarksScreenWrapper}
          options={{ headerShown: true, title: '我的收藏' }}
        />
        <Stack.Screen
          name="FeedManager"
          component={FeedManagerScreenWrapper}
          options={{ headerShown: true, title: '订阅源管理' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreenWrapper}
          options={{ headerShown: true, title: '设置' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
