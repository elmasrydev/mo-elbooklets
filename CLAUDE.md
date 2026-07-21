# CLAUDE.md — mo-elbooklets (ElBooklets)

## What this app is
**ElBooklets** is an **educational platform** for Egyptian students (quizzes, study plans, leaderboards, badges) with a separate **parent** role that links to student accounts and monitors them.
Bilingual **Arabic/English with RTL**. App id: `com.elbooklets.app`.

⚠️ This is an **Expo app (SDK 54)** using prebuild/CNG — `android/` and `ios/` are generated.
It is **NOT** an e-commerce app, **NOT** Shopify, **NOT** bare React Native CLI. If any instruction
elsewhere says "don't use Expo modules", it is for a different project — ignore it here.

There are **two user roles** with parallel auth flows:
- **Student**: Onboarding → Register/Login → OTP (WhatsApp) → Home tabs
- **Parent**: Onboarding (parent tab) → ParentRegister/ParentLogin → Parent **bottom tabs** directly (**no OTP, no profile-completion prompt for parents**). The parent area is a 4-tab bottom navigator (`ParentTabNavigator`): **Dashboard** (children list), **Requests** (link requests), **Add Child** (a modal-trigger tab — `tabPress` opens the shared add-child popup, it is not a screen), **Settings** (parent settings — moved here from the old header gear). Tapping a child opens `ChildDetailsScreen`. Shared parent data lives in `ParentDashboardContext` (wraps `useParentDashboard`). Parent links a child via the add-child modal; the **student approves** in Profile → Parental Linking. See `e2e/PARENT_JOURNEY.md` for the full map.

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
├── generated/     # codegen output (client-preset), DO NOT EDIT (npm run codegen, config: codegen.yml)
├── graphql/       # Domain .graphql operation files + schema.graphql (introspection snapshot — npm run schema:pull, do not hand-edit)
├── hooks/         # useXxx hooks (useOtpTimer, useNotifications, ...)
├── i18n/          # i18next setup; translations in /locales/{ar,en}.json
├── lib/           # apollo.ts, session.ts, analytics, rtl, date/score utils
├── screens/       # XxxScreen.tsx (+ quiz/, study/ subfolders)
├── services/      # notificationService, ...
└── utils/         # logger, crashlyticsHelper, ...
```
- **API calls**: everything goes through **Apollo Client** (`src/lib/apollo.ts`) — `useQuery`/`useMutation`/`useLazyQuery` in components, `apolloClient.query/mutate` in non-React modules (services, contexts). The links supply the auth header, the app language, a 10s timeout, one retry for queries, and logout-on-auth-failure via `src/lib/session.ts` (`revokeSession`). `src/config/api.ts` is now only the environment/URL manager.
- **Partial responses**: the client runs `errorPolicy: 'all'`, so a response can carry data *and* field-level errors. Gate error states with `loadFailureMessage()` (`src/utils/queryError.ts`) — only a response with **no** data is a load failure; never blank a screen that has something to render.
- **GraphQL documents**: operations live in **domain `.graphql` files** under `src/graphql/` (`auth`, `parenting`, `notifications`, `quiz`, ...), validated by codegen against `schema.graphql` (a committed introspection snapshot — refresh with `npm run schema:pull` after backend deployments). Consume them as generated typed documents: `useQuery(XxxDocument)` / `useMutation(XxxDocument)` in components, `apolloClient.query/mutate({ query|mutation: XxxDocument })` elsewhere. **Never add inline query strings or `gql` tags in screens** — every operation lives in a domain `.graphql` file.
- **Auth tokens** in `expo-secure-store` (`auth_token`); misc state in AsyncStorage.
- **Modals**: global confirm/alert via `ModalContext`'s `showConfirm()` → renders `ConfirmModal` (`confirm-modal-ok` testID).
- Design tokens from `src/config/` (`colors.ts`, `spacing.ts`, `layout.ts`, `fonts.ts`) — never hardcode colors/spacing.
- RTL rule: set `textAlign: 'left'` and let native RTL flip it. **Exception — `TextInput`:** use `INPUT_TEXT_ALIGN` from `src/lib/rtl.ts` instead (and never also set `textAlign` in that input's style, or it wins over the prop). Only the `<Text>` path propagates `layoutDirection`, so for inputs `left`/`right` stay *physical* on both platforms and Arabic text would pin to the wrong edge (BKLT-312).
- Arabic font rule: font follows the **text's script, not the UI language** — pass `isArabicText(str)` (`src/config/fonts.ts`) as `forceArabic` to `useTypography` for any user-supplied text (names, titles). Never inline a new Arabic-range regex, and never set a bare `fontWeight` (it drops the custom family on Android — use `typography(style, weight)` / `fontWeight(weight)`).

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
| `npm run codegen` | Regenerate `src/generated/` from the `.graphql` documents (validates them against the schema) |
| `npm run schema:pull` | Refresh `src/graphql/schema.graphql` from the live backend (PRS by default, `SCHEMA_URL=` to override) |
| `npm run lint` | ESLint over `src/` |
| `npm run test:prs` (also `:dev`, `:prod`) | Jest unit tests |
| `npm run e2e:prs` (also `:dev`, `:prod`) | Maestro E2E via `scripts/run_maestro.py` |
| `npm run guardme:prs` | Full gate: codegen drift check + lint + `tsc --noEmit` + jest + docs check |
| `npm run build:apk` / `build:aab` | Android release builds |

## Testing

### Unit tests (Jest + React Native Testing Library)
- Live in `src/__tests__/` (`auth/` for screens+context, `hooks/`, `lib/` for pure utils). Preset `jest-expo`, setup in `jest.setup.ts`.
- Render through `src/__tests__/helpers/renderWithProviders.tsx`; shared mocks in `src/__tests__/__mocks__/` (navigation, expo-secure-store, react-i18next — `t()` returns the key, so assert on translation keys like `'auth.fill_all_fields'`).
- Pattern: mock `apolloClient` (or pass `apolloMocks` to `renderWithProviders`, which wraps every render in `MockedProvider`) plus `ModalContext`, then assert user-visible behavior — validation errors, navigation, what the user sees. Don't assert that a fetch happened, and don't test styles.
- Prefer extracting pure logic into `src/utils/` and testing it directly over mock-heavy hook tests. Shared validators (`src/utils/validators.ts`) and the linking slot state-machine (`src/utils/parentSlots.ts`) are the single sources of truth — import them; never re-inline a copy.

### E2E tests (Maestro)
- Flows in `e2e/auth/` (numbered `01_...yaml`), shared subflows in `e2e/utils/` (`setup-environment.yaml` boots + self-heals to the Onboarding screen and switches env based on `TARGET_ENV`).
- Credentials/env vars in `e2e/env.yaml`; runner `scripts/run_maestro.py` injects them and generates random mobile numbers for PRS/dev registration runs. **Never put real production passwords in `e2e/env.yaml`.**
- **testID convention: kebab-case `{screen}-{element}`** — e.g. `login-mobile-input`, `register-submit-button`, `onboarding-get-started`, `tab-home`, `confirm-modal-ok`, `profile-completion-skip-button`. Every new interactive element gets one.
- Prefer `extendedWaitUntil`/`assertVisible` with timeouts over fixed sleeps (`sleep.js`) — fixed sleeps make flows slow and flaky.
- Known popups a flow must tolerate (use conditional `runFlow when: visible:`): iOS "Not Now" system dialog, rate-limit/warning `confirm-modal-ok`, profile-completion prompt (`profile-completion-skip-button`), register disclaimer (`register-disclaimer-continue-button`), OTP screens (skip via `otp-skip-debug` / `otp-skip-debug-2`).
- Registration E2E runs on **all** envs (student `01` + parent `04` register on prod too). PRS/dev get random mobiles from `run_maestro.py`; prod uses the controlled `PROD_*` numbers in `env.yaml` and the universal test OTP `123456`. **Prod runs create real throwaway accounts — delete them afterwards.**
- **Password policy: registration requires minimum 8 characters, nothing else required** (no mandatory uppercase/digit/special — `PASSWORD_REGEX` in `src/utils/validators.ts`, used by `RegisterScreen`/`ParentRegisterScreen`; BKLT-297, supersedes the earlier 6-char BKLT-284 rule). Matches the backend, which rejects passwords shorter than 8 at registration. Login screens keep a looser 6-char soft-gate (they don't re-validate policy; the backend is the authority). The register hint key is `auth.password_min_8`; login still uses `auth.password_min_6`. The E2E password (`DemoPass1!`) still satisfies it. On a **prod build** the password fields default to secure (`showPassword = isDebugMode()` → false) and Maestro drops special chars in iOS secure fields, so prod flows first tap the show-password toggle (`*-password-toggle`) — guarded by `TARGET_ENV == 'prod'` since debug builds render them visible already.
- **Name policy (BKLT-318)** — `src/utils/validators.ts` is the single source of truth for both person and place names; never re-inline a character-class copy. Two policies, differing only in digits: `isValidPersonName`/`sanitizePersonName` (min 3, **no digits**) for the registration name field, and `isValidPlaceName` (min 2, **digits allowed**) for user-suggested cities/schools — `6th of October City` / `مدينة ٦ أكتوبر` are real cities. Both allow Latin + Arabic letters, tashkeel, and `space - ' .` (not at an edge, never doubled); max 60. Use explicit `\uXXXX` ranges, **not** `\p{L}` — an unsupported property escape is a bundle-load parse error on Hermes, and the hyphen must stay last in an assembled class or it reads as a range. The picker search box is deliberately **unfiltered** so existing entries stay findable; the gate is the add row (`shouldOfferAddNew`) plus `addCity`/`addSchool`. This is a UX/data-quality guard, **not** a security boundary — the backend still owes its own validation.

## Documentation policy (keep docs lean + true)
- **`CLAUDE.md` is the single source of truth** for project conventions. Update it in the *same commit* as any change to behavior/commands/conventions it documents.
- The only living, git-tracked agent docs are: **this file** + **`e2e/PARENT_JOURNEY.md`** (parent-flow map). `README.md` stays for humans.
- Do NOT add narrative / handover / one-off status docs to git — keep them local (gitignored, like `handover_summary.md`). Don't create a second architecture doc; fold it here instead.

## Review gate — run before every commit (agents included)
There is **no automatic git hook**; run this gate **manually** before each commit. Any agent making code changes must run it too:
1. **`npm run guardme`** (lint + `tsc --noEmit` + jest + docs-link check) — must pass.
2. **`/code-review`** on the changes — address its findings before committing.
3. Run the relevant guard skill on what changed and fix its findings:
   - **test-guard** → changed test files
   - **clean-code-guard** → changed production code
   - **docs-guard** → changed `.md` docs (catches docs-vs-code drift)
4. Keep Prettier-only reformatting in a separate `STYLE:` commit.

**E2E is NOT part of this gate.** `npm run e2e:*` (Maestro) is **run manually by the developer** — it needs a device/emulator and real accounts. **Agents must never run E2E**; leave it to the developer.

## Do NOT
- ❌ Treat this as a bare RN CLI / Shopify project (it's Expo, education domain)
- ❌ Edit `src/generated/*` or `src/graphql/schema.graphql` by hand (codegen + `schema:pull` own them)
- ❌ Widen `isDebugMode()` or expose OTP skip outside `app.json > extra.debugMode`
- ❌ Change production component behavior just to make an E2E test pass (e.g. replacing a native `<Modal>`) — add a testID or adjust the flow instead
- ❌ Suppress logs globally (`LogBox.ignoreAllLogs`) or commit screenshots / `test.log` to the repo root
- ❌ Use fixed sleeps in Maestro flows when a visibility wait works
- ❌ Use Redux, NativeWind/Tailwind, or class components
- ❌ Hardcode user-facing strings — use `t()` with keys in `locales/ar.json` + `locales/en.json`
- ❌ Mix Prettier-only reformatting into feature/test commits
