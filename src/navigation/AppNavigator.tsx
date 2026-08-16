/**
 * AppNavigator
 * ─────────────────────────────────────────────────────────────────────────────
 * Flip flags in src/config/featureFlags.ts — nothing else to change.
 *
 * USE_DRAWER_NAVIGATOR
 *   true  → bottom tab bar is hidden; a ☰ menu bar appears at the top and
 *           slides in a custom drawer (Modal + RN built-in Animated — no
 *           @react-navigation/drawer, no reanimated, no worklets)
 *   false → normal bottom tab bar
 *
 * USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS
 *   true  → swipeable All / Income / Expenses tabs inside Transactions
 *   false → original button-filter UI
 *
 * Both flags are independent and can be combined freely.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CommonActions,
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../types';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransactionsTopTabsScreen from '../screens/TransactionsTopTabsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';
import { FLAGS } from '../config/featureFlags';

// ─── Navigator instances ───────────────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<TabParamList>();

// Root nav ref — lets the custom drawer navigate to any tab without needing
// useNavigation() (which requires being inside a navigator context).
const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Transactions screen — controlled by USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS
const TransactionsComponent = FLAGS.USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS
  ? TransactionsTopTabsScreen
  : TransactionsScreen;

// ─── Custom Drawer (Modal + built-in Animated) ────────────────────────────────
// Deliberately avoids @react-navigation/drawer and react-native-reanimated so
// that react-native-worklets is never initialised. The TurboModule arity
// mismatch in Expo Go (NativeWorklets.installTurboModule expects 0 args but
// react-native-worklets@0.8.3 passes 1) only surfaces once reanimated is
// imported. This implementation uses only React Native core APIs.

const DRAWER_WIDTH = 285;

const DRAWER_ITEMS: { name: keyof TabParamList; icon: string; label: string }[] = [
  { name: 'Dashboard',    icon: '📊', label: 'Dashboard'   },
  { name: 'Transactions', icon: '💳', label: 'Transactions' },
  { name: 'Analytics',    icon: '📈', label: 'Analytics'   },
  { name: 'Settings',     icon: '⚙️', label: 'Settings'    },
];

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
}

function AppDrawer({ visible, onClose }: DrawerProps) {
  const { top: topInset } = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  // Keep the Modal mounted during the close animation
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0,              duration: 240, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1,              duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH,  duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,              duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const navigateTo = (screen: keyof TabParamList) => {
    onClose();
    // Short delay so the close animation starts before navigation re-renders
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.navigate({ name: screen as string }),
        );
      }
    }, 50);
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        {/* Dim overlay — tapping it closes the drawer */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: '#000',
                opacity: fadeAnim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [0, 0.45],
                }),
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Drawer panel */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: DRAWER_WIDTH,
            backgroundColor: '#fff',
            transform: [{ translateX: slideAnim }],
          }}
        >
          {/* Purple branding strip */}
          <View
            style={{
              backgroundColor: '#6C63FF',
              paddingHorizontal: 20,
              paddingTop: topInset + 24,
              paddingBottom: 28,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>💰</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>
              ExpenseTracker
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>
              Personal Finance
            </Text>
          </View>

          {/* Nav items */}
          {DRAWER_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.name}
              onPress={() => navigateTo(item.name)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 12,
                marginVertical: 2,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 22, marginRight: 14 }}>{item.icon}</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Footer hint */}
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 24 }}>
            <Text style={{ fontSize: 11, color: '#D1D5DB' }}>
              Tap ☰ in the top bar to reopen this menu
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Menu bar (shown above content when drawer mode is active) ────────────────

function MenuBar({ onOpen }: { onOpen: () => void }) {
  const { top } = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: '#F8F9FB',
        paddingTop: top + 4,
        paddingBottom: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}
    >
      <TouchableOpacity onPress={onOpen} style={{ padding: 6, marginRight: 10 }} accessibilityLabel="Open menu">
        <Text style={{ fontSize: 22, color: '#6C63FF' }}>☰</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827', letterSpacing: -0.3 }}>
        ExpenseTracker
      </Text>
    </View>
  );
}

// ─── Bottom Tab Navigator (FLAGS.USE_DRAWER_NAVIGATOR = false) ────────────────

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.55 }}>
      {icon}
    </Text>
  );
}

function MainTabs() {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const TAB_CONTENT_HEIGHT = 56;
  const TAB_PADDING_TOP    = 6;
  const TAB_PADDING_BOTTOM = 8;

  return (
    <View style={{ flex: 1 }}>
      {/* ── Menu bar (only when drawer mode is active) ── */}
      {FLAGS.USE_DRAWER_NAVIGATOR && (
        <MenuBar onOpen={() => setDrawerOpen(true)} />
      )}

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: FLAGS.USE_DRAWER_NAVIGATOR
            ? { display: 'none' }   // hide the tab bar; drawer replaces it
            : {
                backgroundColor: '#FFFFFF',
                borderTopColor: '#E5E7EB',
                borderTopWidth: 1,
                height: TAB_CONTENT_HEIGHT + TAB_PADDING_TOP + bottomInset,
                paddingTop: TAB_PADDING_TOP,
                paddingBottom: bottomInset > 0 ? bottomInset : TAB_PADDING_BOTTOM,
              },
          tabBarActiveTintColor:   '#6C63FF',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }}
        />
        <Tab.Screen
          name="Transactions"
          component={TransactionsComponent}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💳" focused={focused} /> }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📈" focused={focused} /> }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} /> }}
        />
      </Tab.Navigator>

      {/* ── Custom drawer overlay (only when drawer mode is active) ── */}
      {FLAGS.USE_DRAWER_NAVIGATOR && (
        <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}
    </View>
  );
}

// ─── Root Stack ───────────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="EditTransaction"
          component={EditTransactionScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
