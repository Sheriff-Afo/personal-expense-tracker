/**
 * Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the ONE place you change to switch between navigation implementations.
 * No other file needs to be touched.
 *
 * USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS
 *   true  → Transactions tab uses swipeable Material Top Tabs (All / Income / Expenses)
 *   false → Transactions tab uses the original button-based filter UI
 *
 * Usage in AppNavigator.tsx:
 *   import { FLAGS } from '../config/featureFlags';
 *   component={FLAGS.USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS
 *     ? TransactionsTopTabsScreen
 *     : TransactionsScreen}
 */
export const FLAGS = {
  USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS: true,
} as const;
