# CLAUDE.md — mo-elbooklets (ElBooklets)

## What this app is
**ElBooklets** is an **educational platform** for Egyptian students (quizzes, study plans, leaderboards, badges) with a separate **parent** role that links to student accounts and monitors them.
Bilingual **Arabic/English with RTL**. App id: `com.elbooklets.app`.

⚠️ This is an **Expo app (SDK 54)** using prebuild/CNG — `android/` and `ios/` are generated.
It is **NOT** an e-commerce app, **NOT** Shopify, **NOT** bare React Native CLI. If any instruction
elsewhere says "don't use Expo modules", it is for a different project — ignore it here.

There are **two user roles** with parallel auth flows:
- **Student**: Onboarding → Register/Login → OTP (WhatsApp) → Home tabs
- **Parent**: Onboarding (parent tab) → ParentRegister/ParentLogin → ParentDashboard directly (**no OTP, no profile-completion prompt for parents**). Parent links a child via the dashboard add-child modal; the **student approves** in Profile → Parental Linking. See `e2e/PARENT_JOURNEY.md` for the full map.

## Environments
Three backends, selected at runtime via the API URL Switcher (debug builds only):

| Env | URL | Notes |
|---|---|---|
| PRS | `https://prs.elbooklets.com/graphql` | Active testing env — **default when `debugMode: true`** |
| Demo/dev | `https://demo.elbooklets.com/graphql` | |
| Production | `https://elbooklets.com/graphql` | Default when `debugMode: false` |

- `app.json > extra.debugMode` (build-time flag, read via `expo-constants`) controls the default API URL **and** all debug UI: the API switcher chip on Onboarding, the **OTP skip buttons** (`otp-skip-debug`, `otp-skip-debug-2`), Reactotron, etc. Logic lives in `src/config/debug.ts` + `src/config/api.ts`.
- **Security rule: the OTP bypass must only ever be gated by `isDebugMode()` from the build-time flag. Never widen `isDebugMode()` (e.g. emulator detection, `__DEV__`) — a prod build must never show OTP skip.**

## Architecture
```
src/
├── components/    # Reusable UI (TabNavigator, ConfirmModal, AppButton, ...)
├── config/        # Design tokens (colors, spacing, layout, fonts) + api.ts + debug.ts
├── context/       # AuthContext, ThemeContext, LanguageContext, ModalContext, ForceUpdateContext
├── generated/     # graphql.ts — codegen output, DO NOT EDIT (npm run codegen, config: codegen.yml)
├── graphql/       # GraphQL documents
├── hooks/         # useXxx hooks (useOtpTimer, useNotifications, ...)
├── i18n/          # i18next setup; translations in /locales/{ar,en}.json
├── lib/           # apollo.ts, graphqlClient.ts, analytics, rtl, date/score utils
├── screens/       # XxxScreen.tsx (+ quiz/, study/ subfolders)
├── services/      # notificationService, ...
└── utils/         # logger, crashlyticsHelper, ...
```
- **API calls**: most screens use `tryFetchWithFallback()` from `src/config/api.ts` (raw fetch GraphQL with URL fallback + auth-error handling), not Apollo hooks. Check the screen you're editing before assuming.
- **Auth tokens** in `expo-secure-store` (`auth_token`); misc state in AsyncStorage.
- **Modals**: global confirm/alert via `ModalContext`'s `showConfirm()` → renders `ConfirmModal` (`confirm-modal-ok` testID).
- Design tokens from `src/config/` (`colors.ts`, `spacing.ts`, `layout.ts`, `fonts.ts`) — never hardcode colors/spacing.
- RTL rule: set `textAlign: 'left'` and let native RTL flip it.

### Boki AI Assistant (BKLT-221)
**Boki** (بوكي) is the student AI study assistant. Backend contract: `booki-graphql-api.md` (repo root, gitignored — keep local). Single request/response (`aiChat` mutation returns the full answer — **no streaming**).
- **Data layer is isolated** in `src/services/bokiApi.ts` (wraps `tryFetchWithFallback`) + raw ops in `src/graphql/boki.ts` + hand-written types in `src/types/boki.ts`. A contract change touches only these. Pure helpers: `src/utils/bokiErrors.ts` (`classifyBokiError` → `offline`/`rateLimit`/`backend`, `BokiApiError`) and `src/utils/bokiMessages.ts` (turn transforms) — unit-tested directly.
- **Global FAB** `src/components/boki/BokiFloatingButton.tsx` is mounted once in `App.tsx` (outside `NavigationContainer`), shown only for `isAuthenticated && userRole === 'student'`, route-aware via `navigationRef` with a hidden-routes denylist. Exactly two screens — `BokiChat` + `BokiConversations` — are registered in `TabNavigator`'s inner stack; the message list is an **inverted FlatList** (turns stored newest-first, older pages via `onEndReached`). `useBokiChat()` owns turns/send/retry/history/feedback; selecting a conversation from history calls `navigation.popTo('BokiChat', { conversationId })` (go **back** to the single chat screen, never push a new one), and a route-param effect calls `loadConversation` to refill it; "new conversation" clears the thread in place and resets the param.
- **Connectivity**: `@react-native-community/netinfo` via `src/hooks/useNetworkStatus.ts` distinguishes offline from backend errors (NetInfo is a native module → dev-client rebuild needed). Rate limit is 10 req/min → 429.
- **Report + feedback** (Phase 3): each answer bubble has like/dislike (optimistic `aiChatFeedback`, toggles to NONE) + a Report button opening `BokiReportSheet` (fixed reason set `incorrect/irrelevant/offensive/other` — no backend reasons query — + optional notes → `aiChatReport`, confirmation via `ModalContext`).
- **Analytics** (Title Case, `feature: 'boki'`) via `analytics.trackBoki*` in `src/lib/analytics.ts`. testIDs: `boki-fab`, `boki-chat-input`, `boki-send-button`, `boki-message-list`, `boki-typing-indicator`, `boki-retry-button`, `boki-source-link`, `boki-history-button`, `boki-new-conversation`, `boki-conversation-list`, `boki-conversation-{id}`, `boki-like-button`, `boki-dislike-button`, `boki-report-button`, `boki-report-reason-{reason}`, `boki-report-submit`.
- **Status**: Phases 1–3 shipped (chat + errors/retry + history + new conversation + report + like/dislike). **Known gap**: reference-link deep-nav to a lesson is blocked — `sources` lack `subjectId` and there's no `lesson(id)` query (`StudyLesson` needs a full lesson object); taps currently surface the reference + fire analytics only. Backend exposes `conversations`/`conversationMessages` as queries, `aiChat*` as mutations (introspect before adding ops — the contract doc has been wrong once).

## Commands
| Command | What it does |
|---|---|
| `npm run ios` / `npm run android` | Build & run dev client |
| `npm run codegen` | Regenerate `src/generated/graphql.ts` |
| `npm run lint` | ESLint over `src/` |
| `npm run test:prs` (also `:dev`, `:prod`) | Jest unit tests |
| `npm run e2e:prs` (also `:dev`, `:prod`) | Maestro E2E via `scripts/run_maestro.py` |
| `npm run guardme:prs` | Full gate: lint + `tsc --noEmit` + jest + docs check |
| `npm run build:apk` / `build:aab` | Android release builds |

## Testing

### Unit tests (Jest + React Native Testing Library)
- Live in `src/__tests__/` (`auth/` for screens+context, `hooks/`, `lib/` for pure utils). Preset `jest-expo`, setup in `jest.setup.ts`.
- Render through `src/__tests__/helpers/renderWithProviders.tsx`; shared mocks in `src/__tests__/__mocks__/` (navigation, expo-secure-store, react-i18next — `t()` returns the key, so assert on translation keys like `'auth.fill_all_fields'`).
- Pattern: mock `tryFetchWithFallback` and `ModalContext`, assert user-visible behavior (validation errors, navigation, API called). Don't test styles or implementation details.
- Prefer extracting pure logic into `src/utils/` and testing it directly over mock-heavy hook tests. Shared validators (`src/utils/validators.ts`) and the linking slot state-machine (`src/utils/parentSlots.ts`) are the single sources of truth — import them; never re-inline a copy.

### E2E tests (Maestro)
- Flows in `e2e/auth/` (numbered `01_...yaml`), shared subflows in `e2e/utils/` (`setup-environment.yaml` boots + self-heals to the Onboarding screen and switches env based on `TARGET_ENV`).
- Credentials/env vars in `e2e/env.yaml`; runner `scripts/run_maestro.py` injects them and generates random mobile numbers for PRS/dev registration runs. **Never put real production passwords in `e2e/env.yaml`.**
- **testID convention: kebab-case `{screen}-{element}`** — e.g. `login-mobile-input`, `register-submit-button`, `onboarding-get-started`, `tab-home`, `confirm-modal-ok`, `profile-completion-skip-button`. Every new interactive element gets one.
- Prefer `extendedWaitUntil`/`assertVisible` with timeouts over fixed sleeps (`sleep.js`) — fixed sleeps make flows slow and flaky.
- Known popups a flow must tolerate (use conditional `runFlow when: visible:`): iOS "Not Now" system dialog, rate-limit/warning `confirm-modal-ok`, profile-completion prompt (`profile-completion-skip-button`), register disclaimer (`register-disclaimer-continue-button`), OTP screens (skip via `otp-skip-debug` / `otp-skip-debug-2`).
- Registration E2E runs on **all** envs (student `01` + parent `04` register on prod too). PRS/dev get random mobiles from `run_maestro.py`; prod uses the controlled `PROD_*` numbers in `env.yaml` and the universal test OTP `123456`. **Prod runs create real throwaway accounts — delete them afterwards.**
- **Strong passwords are enforced on every env** (no debug relaxation — `STRONG_PASSWORD_REGEX` in `RegisterScreen`/`ParentRegisterScreen`), so the E2E password must be strong (`DemoPass1!`). On a **prod build** the password fields default to secure (`showPassword = isDebugMode()` → false) and Maestro drops special chars in iOS secure fields, so prod flows first tap the show-password toggle (`*-password-toggle`) — guarded by `TARGET_ENV == 'prod'` since debug builds render them visible already.

## Documentation policy (keep docs lean + true)
- **`CLAUDE.md` is the single source of truth** for project conventions. Update it in the *same commit* as any change to behavior/commands/conventions it documents.
- The only living, git-tracked agent docs are: **this file** + **`e2e/PARENT_JOURNEY.md`** (parent-flow map). `README.md` stays for humans.
- Do NOT add narrative / handover / one-off status docs to git — keep them local (gitignored, like `handover_summary.md`). Don't create a second architecture doc; fold it here instead.

## Review gate — run before every commit
1. `npm run guardme` (lint + `tsc --noEmit` + jest + docs-link check) — must pass. A commit-time hook runs this automatically and blocks the commit on failure.
2. Run the relevant guard skill on what changed and fix its findings before committing:
   - **test-guard** → changed test files
   - **clean-code-guard** → changed production code
   - **docs-guard** → changed `.md` docs (catches docs-vs-code drift)
3. Keep Prettier-only reformatting in a separate `STYLE:` commit.

## Do NOT
- ❌ Treat this as a bare RN CLI / Shopify project (it's Expo, education domain)
- ❌ Edit `src/generated/graphql.ts` by hand
- ❌ Widen `isDebugMode()` or expose OTP skip outside `app.json > extra.debugMode`
- ❌ Change production component behavior just to make an E2E test pass (e.g. replacing a native `<Modal>`) — add a testID or adjust the flow instead
- ❌ Suppress logs globally (`LogBox.ignoreAllLogs`) or commit screenshots / `test.log` to the repo root
- ❌ Use fixed sleeps in Maestro flows when a visibility wait works
- ❌ Use Redux, NativeWind/Tailwind, or class components
- ❌ Hardcode user-facing strings — use `t()` with keys in `locales/ar.json` + `locales/en.json`
- ❌ Mix Prettier-only reformatting into feature/test commits
