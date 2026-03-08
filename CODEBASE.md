# CODEBASE.md - Project Vision & Context

> This file is the "Source of Truth" for the Antigravity agent. It ensures every command is executed with full awareness of the project's architecture and standards.

## 📱 Project Overview
- **Type**: React Native (Expo SDK 54)
- **Primary Language**: TypeScript
- **Goal**: A multi-language (Arabic/English) educational platform with RTL support.

## 🏗️ Technical Architecture

### 1. Data Layer (GraphQL & Apollo)
- **Client**: Apollo Client (configured in `src/lib/apollo`).
- **Source**: `.graphql` files in `src/graphql/`.
- **Codegen**: Automated TypeScript types and hooks in `src/generated/graphql.ts`.
- **Workflow**: Run `npm run codegen` after any changes to `.graphql` files.

### 2. State Management (Context API)
- **Auth**: `src/context/AuthContext.tsx` handles user sessions.
- **Theme**: `src/context/ThemeContext.tsx` manages the design system and light/dark modes.
- **Language**: `src/context/LanguageContext.tsx` syncs with i18next and handles RTL state.

### 3. Navigation
- **Manager**: `src/components/AppNavigator.tsx` (referenced in `App.tsx`).
- **Screens**: Grouped logically in `src/screens/`.

### 4. Internationalization (i18n)
- **Core**: `src/i18n/index.ts` initializes `i18next`.
- **RTL**: Handled via `I18nManager` and custom hooks. Remember the **"left-to-right" logic rule** (set `textAlign: 'left'`, let native RTL flip it).

## 📂 Directory Map
| Path | Responsibility |
| :--- | :--- |
| `src/components/` | Reusable UI components (e.g., `UnifiedHeader.tsx`). |
| `src/config/` | Design tokens (`colors.ts`, `spacing.ts`, `layout.ts`). |
| `src/graphql/` | Raw GraphQL queries and schema definitions. |
| `src/generated/` | Auto-generated Apollo hooks and types (DO NOT EDIT MANUALLY). |
| `src/hooks/` | Custom hooks (e.g., `useRTL`, `useTheme`). |
| `src/utils/` | Helper functions and business logic. |

## 🛠️ Efficiency & Speed Tips
- **Consistency**: Always use design tokens from `src/config/`.
- **Auto-Correction**: If a UI edit feels "manual," check if there's a hook or config value first.
- **Verification**: Run `npm run lint` before finalizing any code change.
