import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { getAllTopics, type Topic } from '@/db/topics';

import HomeScreen from '@/screens/home/HomeScreen';

export type RootStackParamList = {
  Home: undefined;
  Reader: { articleId: number };
  Discover: undefined;
  Profile: undefined;
  Bookmarks: undefined;
  RecentlyRead: undefined;
  FeedManager: undefined;
  Settings: undefined;
};

type TopicFilter = { id: number | null; name: string };
const TopicFilterContext = createContext<{
  current: TopicFilter;
  setCurrent: (t: TopicFilter) => void;
}>({ current: { id: null, name: '全部' }, setCurrent: () => {} });

export function useTopicFilter() {
  return useContext(TopicFilterContext);
}

export type DrawerParamList = { MainStack: undefined };
const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function CustomDrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { current, setCurrent } = useTopicFilter();
  const [topics, setTopics] = useState<Topic[]>([]);

  // Refresh topics every time drawer state changes (opens)
  useEffect(() => { getAllTopics().then(setTopics); }, [state]);

  const goHome = useCallback((filter: TopicFilter) => {
    setCurrent(filter);
    navigation.navigate('MainStack', { screen: 'Home' });
    navigation.closeDrawer();
  }, [navigation, setCurrent]);

  const goTo = useCallback((screen: string) => {
    navigation.navigate('MainStack', { screen });
    navigation.closeDrawer();
  }, [navigation]);

  return (
    <View style={[styles.drawer, { backgroundColor: colors.surface, paddingTop: insets.top + 12 }]}>
      <Text style={[styles.drawerTitle, { color: colors.onSurface }]}>华读</Text>

      <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
        {/* Topic filters */}
        <Text style={[styles.drawerSection, { color: colors.onSurfaceVariant }]}>话题</Text>
        <Pressable
          onPress={() => goHome({ id: null, name: '全部' })}
          style={[styles.drawerItem, current.id === null && { backgroundColor: colors.primary + '12' }]}
        >
          <MaterialCommunityIcons name="newspaper-variant-multiple-outline" size={20} color={current.id === null ? colors.primary : colors.onSurfaceVariant} />
          <Text style={[styles.drawerItemText, { color: current.id === null ? colors.primary : colors.onSurface }]}>全部文章</Text>
        </Pressable>
        {topics.map(topic => (
          <Pressable
            key={topic.id}
            onPress={() => goHome({ id: topic.id, name: topic.name })}
            style={[styles.drawerItem, current.id === topic.id && { backgroundColor: colors.primary + '12' }]}
          >
            <MaterialCommunityIcons name={(topic.icon || 'folder') as any} size={20} color={current.id === topic.id ? colors.primary : colors.onSurfaceVariant} />
            <Text style={[styles.drawerItemText, { color: current.id === topic.id ? colors.primary : colors.onSurface }]}>{topic.name}</Text>
          </Pressable>
        ))}

        <View style={[styles.drawerDivider, { backgroundColor: colors.outline + '20' }]} />

        {/* Navigation */}
        <Text style={[styles.drawerSection, { color: colors.onSurfaceVariant }]}>功能</Text>
        {[
          { screen: 'Discover', icon: 'compass-outline', label: '发现订阅' },
          { screen: 'Bookmarks', icon: 'star-outline', label: '我的收藏' },
          { screen: 'RecentlyRead', icon: 'history', label: '最近阅读' },
          { screen: 'FeedManager', icon: 'rss', label: '订阅源管理' },
          { screen: 'Settings', icon: 'cog-outline', label: '设置' },
        ].map(item => (
          <Pressable key={item.screen} onPress={() => goTo(item.screen)} style={styles.drawerItem}>
            <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.onSurfaceVariant} />
            <Text style={[styles.drawerItemText, { color: colors.onSurface }]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const LazyDiscover = React.lazy(() => import('@/screens/discover/DiscoverScreen'));
const LazyProfile = React.lazy(() => import('@/screens/profile/ProfileScreen'));
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

function MainStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.onSurface,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Reader" component={wrap(LazyReader)} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="Discover" component={wrap(LazyDiscover)} options={{ headerShown: true, title: '发现' }} />
      <Stack.Screen name="Profile" component={wrap(LazyProfile)} options={{ headerShown: true, title: '我的' }} />
      <Stack.Screen name="Bookmarks" component={wrap(LazyBookmarks)} options={{ headerShown: true, title: '我的收藏' }} />
      <Stack.Screen name="RecentlyRead" component={wrap(LazyRecentlyRead)} options={{ headerShown: true, title: '最近阅读' }} />
      <Stack.Screen name="FeedManager" component={wrap(LazyFeedManager)} options={{ headerShown: true, title: '订阅源管理' }} />
      <Stack.Screen name="Settings" component={wrap(LazySettings)} options={{ headerShown: true, title: '设置' }} />
    </Stack.Navigator>
  );
}

export function Navigation() {
  const [topicFilter, setTopicFilter] = useState<TopicFilter>({ id: null, name: '全部' });
  const { colors } = useTheme();

  return (
    <TopicFilterContext.Provider value={{ current: topicFilter, setCurrent: setTopicFilter }}>
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerType: 'slide',
            drawerStyle: { width: 270, backgroundColor: colors.surface },
            overlayColor: 'rgba(0,0,0,0.3)',
            swipeEnabled: true,
            swipeEdgeWidth: 40,
            swipeMinDistance: 5,
            gestureHandlerProps: { activeOffsetX: [5, 5] },
          }}
        >
          <Drawer.Screen name="MainStack" component={MainStack} />
        </Drawer.Navigator>
      </NavigationContainer>
    </TopicFilterContext.Provider>
  );
}

const styles = StyleSheet.create({
  drawer: { flex: 1, paddingHorizontal: 14 },
  drawerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, paddingHorizontal: 14, marginBottom: 16 },
  drawerScroll: { flex: 1 },
  drawerSection: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 14, marginTop: 12, marginBottom: 6 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, marginBottom: 1 },
  drawerItemText: { fontSize: 14, fontWeight: '500' },
  drawerDivider: { height: StyleSheet.hairlineWidth, marginVertical: 12, marginHorizontal: 14 },
});
