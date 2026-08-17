# 💰 Personal Expense Tracker

A fully native Android (and iOS) expense tracking app built with **React Native**, **Expo**, **TypeScript**, and **NativeWind (Tailwind CSS)**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Monthly totals, all-time spend, top category, 6-month bar chart, recent transactions |
| 📋 **Expenses** | Full list with search, category filter pills, total summary, edit & delete |
| ➕ **Add / Edit** | Validated form with category picker modal, amount, date, optional description |
| 📈 **Analytics** | Spending trend line chart, category pie chart, progress bars, highest expense highlight |
| 💾 **Offline storage** | All data stored locally via `AsyncStorage` — no backend required |
| 🌱 **Demo data** | Auto-seeded with 10 sample expenses on first launch |

---

## 🛠 Tech Stack

- **React Native** 0.74 + **Expo** SDK 51
- **TypeScript** — strict mode
- **NativeWind v4** — Tailwind CSS utility classes for React Native
- **React Navigation** — Bottom tabs + Native stack (modal screens)
- **AsyncStorage** — Offline-first persistent storage
- **react-native-chart-kit** — Bar, Line, and Pie charts
- **react-native-svg** — Chart rendering dependency

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- **Expo Go** app on your Android phone

### Install & Run

```bash
npm install
npx expo start
```

Scan the QR code shown in the terminal with the **Expo Go** app on your Android phone.

### Build APK (for device install without Expo Go)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

---

## 📁 Project Structure

```
├── App.tsx                      # Root component, seeds demo data
├── global.css                   # Tailwind entry point
├── tailwind.config.js           # NativeWind / Tailwind config
├── metro.config.js              # Metro bundler + NativeWind setup
├── babel.config.js              # Babel config with NativeWind preset
├── tsconfig.json                # TypeScript strict config
└── src/
    ├── types/index.ts           # Shared TypeScript interfaces
    ├── constants/categories.ts  # Category definitions (icon, color, label)
    ├── storage/expenseStorage.ts# AsyncStorage CRUD helpers
    ├── navigation/AppNavigator.tsx
    ├── components/
    │   ├── ExpenseCard.tsx      # Single expense row card
    │   ├── StatCard.tsx         # KPI stat tile
    │   └── CategoryPicker.tsx   # Modal category selector
    └── screens/
        ├── DashboardScreen.tsx
        ├── ExpensesScreen.tsx
        ├── AddExpenseScreen.tsx
        ├── EditExpenseScreen.tsx
        └── AnalyticsScreen.tsx
```

---

## 📦 Categories

Food & Dining · Transportation · Housing · Utilities · Healthcare · Entertainment · Shopping · Education · Travel · Personal Care · Subscriptions · Other

---

## 📄 License

MIT
