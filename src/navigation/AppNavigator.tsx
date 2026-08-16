import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { RootStackParamList, TabParamList } from '../types';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransactionsTopTabsScreen from '../screens/TransactionsTopTabsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';
// ─── Navigation feature flags ─────────────────────────────────────────────────
// Edit src/config/featureFlags.ts — that file is the ONLY thing to change.
import { FLAGS } from '../config/featureFlags';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<TabParamList>();
const Drawer = createDrawerNavigator<TabParamList>();

/** Picks the right Transactions component based on the top-tabs flag. */
const TransactionsComponent = FLAGS.USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS
  ? TransactionsTopTabsScreen
  : TransactionsScreen;

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Tab Navigator  (FLAGS.USE_DRAWER_NAVIGATOR = false)
// ─────────────────────────────────────────────────────────────────────────────

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.55 }}>
      {icon}
    </Text>
  );
}

function MainTabs() {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const TAB_CONTENT_HEIGHT = 56;
  const TAB_PADDING_TOP    = 6;
  const TAB_PADDING_BOTTOM = 8;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: TAB_CONTENT_HEIGHT + TAB_PADDING_TOP + bottomInset,
          paddingTop: TAB_PADDING_TOP,
          paddingBottom: bottomInset > 0 ? bottomInset : TAB_PADDING_BOTTOM,
        },
        tabBarActiveTintColor: '#6C63FF',
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
        component={TransactionsComponent}  // ← controlled by featureFlags.ts
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer Navigator  (FLAGS.USE_DRAWER_NAVIGATOR = true)
// ─────────────────────────────────────────────────────────────────────────────

const DRAWER_ITEMS: { name: keyof TabParamList; icon: string; label: string }[] = [
  { name: 'Dashboard',    icon: '📊', label: 'Dashboard'   },
  { name: 'Transactions', icon: '💳', label: 'Transactions' },
  { name: 'Analytics',    icon: '📈', label: 'Analytics'   },
  { name: 'Settings',     icon: '⚙️', label: 'Settings'    },
];

function CustomDrawerContent({ state, navigation }: DrawerContentComponentProps) {
  const { top: topInset } = useSafeAreaInsets();

  return (
    <DrawerContentScrollView
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1, paddingTop: 0 }}
    >
      {/* ── Branding strip ── */}
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

      {/* ── Nav items ── */}
      {DRAWER_ITEMS.map((item, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={item.name}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 12,
              marginVertical: 2,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: isFocused ? '#EEF0FF' : 'transparent',
            }}
          >
            {/* Active indicator pill on the left edge */}
            {isFocused && (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 10,
                  bottom: 10,
                  width: 3,
                  backgroundColor: '#6C63FF',
                  borderRadius: 2,
                }}
              />
            )}
            <Text style={{ fontSize: 22, marginRight: 14 }}>{item.icon}</Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: isFocused ? '#6C63FF' : '#374151',
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* ── Footer hint ── */}
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text style={{ fontSize: 11, color: '#D1D5DB' }}>
          Swipe right from the left edge to open this menu
        </Text>
      </View>
    </DrawerContentScrollView>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        // Each screen owns its own header row — hide the drawer's auto-header
        // to avoid a doubled title. Users open the drawer by swiping from the
        // left edge (swipeEdgeWidth below) or via a button you can add to any
        // screen with: const nav = useNavigation(); nav.openDrawer()
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#fff',
          width: 285,
        },
        // 'front' slides the drawer over the content (most common on Android)
        // 'slide' pushes the content sideways — try both and see which you prefer
        drawerType: 'front',
        overlayColor: 'rgba(0, 0, 0, 0.45)',
        // How many pixels from the left edge count as a swipe open gesture
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="Dashboard"    component={DashboardScreen} />
      <Drawer.Screen
        name="Transactions"
        component={TransactionsComponent}  // ← same flag as bottom tabs
      />
      <Drawer.Screen name="Analytics"    component={AnalyticsScreen} />
      <Drawer.Screen name="Settings"     component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Stack (wraps whichever main nav is active + modal screens)
// ─────────────────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* ← Flip USE_DRAWER_NAVIGATOR in src/config/featureFlags.ts */}
        <Stack.Screen
          name="MainTabs"
          component={FLAGS.USE_DRAWER_NAVIGATOR ? MainDrawer : MainTabs}
        />
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
