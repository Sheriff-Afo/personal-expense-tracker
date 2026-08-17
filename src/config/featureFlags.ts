/**
 * Feature Flags — Navigation
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the ONE place to switch between navigation implementations.
 * No other file needs to change.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ USE_DRAWER_NAVIGATOR                                            │
 * │   true  → Side Drawer (swipe from left edge, or tap ☰)         │
 * │   false → Bottom Tab bar (default)                             │
 * │                                                                 │
 * │ USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS                          │
 * │   true  → Swipeable top tabs inside Transactions               │
 * │            (All / Income / Expenses)                            │
 * │   false → Original button-filter UI                            │
 * │                                                                 │
 * │ The two flags are independent — all four combinations work:     │
 * │   Drawer + TopTabs  |  Drawer + ButtonFilter                   │
 * │   BottomTab + TopTabs  |  BottomTab + ButtonFilter             │
 * └─────────────────────────────────────────────────────────────────┘
 */
export const FLAGS = {
  USE_DRAWER_NAVIGATOR: false,
  USE_MATERIAL_TOP_TABS_FOR_TRANSACTIONS: true,
} as const;
