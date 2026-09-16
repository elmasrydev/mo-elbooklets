# CLAUDE.md — mo-elbooklets (ElBooklets)

## What this app is
**ElBooklets** is an **educational platform** for Egyptian students (quizzes, study plans, leaderboards, badges) with a separate **parent** role that links to student accounts and monitors them.
Bilingual **Arabic/English with RTL**. App id: `com.elbooklets.app`.

⚠️ This is an **Expo app (SDK 54)** using prebuild/CNG — `android/` and `ios/` are generated.
It is **NOT** an e-commerce app, **NOT** Shopify, **NOT** bare React Native CLI. If any instruction
elsewhere says "don't use Expo modules", it is for a different project — ignore it here.

There are **two user roles** with parallel auth flows:
- **Student**: Onboarding → Register/Login → OTP (WhatsApp) → Home tabs
- **Parent**: Onboarding (parent tab) → ParentRegister/ParentLogin → OTP (WhatsApp) → Parent **bottom tabs** (**no profile-completion prompt for parents**). Both roles are gated on `mobile_verified_at` by `AppNavigator`, and both share `OTPVerificationScreen` via its `audience` route param. The parent area is a 4-tab bottom navigator (`ParentTabNavigator`): **Dashboard** (children list), **Requests** (link requests), **Add Child** (a modal-trigger tab — `tabPress` opens the shared add-child popup, it is not a screen), **Settings** (parent settings — moved here from the old header gear). Tapping a child opens `ChildDetailsScreen`. Shared parent data lives in `ParentDashboardContext` (wraps `useParentDashboard`). Parent links a child via the add-child modal; the **student approves** in Profile → Parental Linking. See `e2e/PARENT_JOURNEY.md` for the full map.

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
├── i18n/          # i18next setup; translations in src/i18n/locales/{ar,en}.json (root locales/ = native app name only)
├── lib/           # apollo.ts, session.ts, analytics, rtl, date/score utils
├── screens/       # XxxScreen.tsx (+ quiz/, study/ subfolders)
├── services/      # notificationService, ...
└── utils/         # logger, crashlyticsHelper, ...
```
- **API calls**: everything goes through **Apollo Client** (`src/lib/apollo.ts`) — `useQuery`/`useMutation`/`useLazyQuery` in components, `apolloClient.query/mutate` in non-React modules (services, contexts). The links supply the auth header, the app language, a 10s timeout, one retry for queries, and logout-on-auth-failure via `src/lib/session.ts` (`revokeSession`). `src/config/api.ts` is now only the environment/URL manager.
- **Partial responses**: the client runs `errorPolicy: 'all'`, so a response can carry data *and* field-level errors. Gate error states with `loadFailureMessage()` (`src/utils/queryError.ts`) — only a response with **no** data is a load failure; never blank a screen that has something to render.
- **GraphQL documents**: operations live in **domain `.graphql` files** under `src/graphql/` (`auth`, `parenting`, `notifications`, `quiz`, ...), validated by codegen against `schema.graphql` (a committed introspection snapshot — refresh with `npm run schema:pull` after backend deployments). Consume them as generated typed documents: `useQuery(XxxDocument)` / `useMutation(XxxDocument)` in components, `apolloClient.query/mutate({ query|mutation: XxxDocument })` elsewhere. **Never add inline query strings or `gql` tags in screens** — every operation lives in a domain `.graphql` file.
- **Apollo cache**: `MatchColumnItem` and `LeaderboardEntry` are **not normalized** (`keyFields: false`) — their ids repeat across questions/boards and rank/xp are board-relative. Consequence: `cache.identify({__typename:'LeaderboardEntry', id})` returns `undefined`, and a `cache.modify` keyed on it **silently does nothing**. Anything that must reach a cached entry goes through `patchCachedLeaderboardEntries()` (`src/utils/leaderboardCache.ts`), which walks the `leaderboard` root field across all argument variants.
- **Auth tokens** in `expo-secure-store` (`auth_token`); misc state in AsyncStorage.
- **Modals**: global confirm/alert via `ModalContext`'s `showConfirm()` → renders `ConfirmModal` (`confirm-modal-ok` testID).
- Design tokens from `src/config/` (`colors.ts`, `spacing.ts`, `layout.ts`, `fonts.ts`) — never hardcode colors/spacing.
- RTL rule: set `textAlign: 'left'` and let native RTL flip it. **Exception — `TextInput`:** use `INPUT_TEXT_ALIGN` from `src/lib/rtl.ts` instead (and never also set `textAlign` in that input's style, or it wins over the prop). Only the `<Text>` path propagates `layoutDirection`, so for inputs `left`/`right` stay *physical* on both platforms and Arabic text would pin to the wrong edge (BKLT-312).
- Arabic font rule: font follows the **text's script, not the UI language** — pass `isArabicText(str)` (`src/config/fonts.ts`) as `forceArabic` to `useTypography` for any user-supplied text (names, titles). Never inline a new Arabic-range regex, and never set a bare `fontWeight` (it drops the custom family on Android — use `typography(style, weight)` / `fontWeight(weight)`).

### Crash reporting & analytics (Firebase)
Crashlytics and Analytics report from **every** build — release or dev client, device or simulator,
`debugMode` true or false. `debugMode` gates console output in `src/utils/logger.ts`, never reporting.
- **Native switches live in `firebase.json`** (`react-native` block) and are baked in at build time —
  change one, rebuild the dev client. Keys must be React Native Firebase's exact names: an unknown key
  is **silently ignored**. The screen-reporting switch was spelt `analytics_automatic_screen_reporting_enabled`
  (no `google_` prefix) until 2026-09-14 and never applied; `src/__tests__/lib/firebaseConfig.test.ts`
  now checks every key against RNFB's own `firebase-schema.json`.
- **Crashlytics**: `crashlytics_auto_collection_enabled` (release) and `crashlytics_debug_enabled` (debug
  builds) are both `true`. The built Info.plist still carries `FirebaseCrashlyticsCollectionEnabled = NO`
  (and the Android manifest `firebase_crashlytics_collection_enabled = false`) — that is RNFB's
  auto-disabler; its init provider switches collection on at launch from `firebase.json`, so don't
  "fix" those. iOS dSYMs upload from the generated project's `[CP-User] [RNFB] Crashlytics
  Configuration` build phase. A watchdog kill (`0x8BADF00D` — the main thread blocked for ~10 s, like
  the old mind-map freeze) is a SIGKILL the app cannot report, so it may never reach Crashlytics; look
  in Xcode Organizer or the device's crash logs.
- **Analytics goes through Segment as a local bus** (`src/lib/segmentClient.ts` → Segment's
  `FirebasePlugin`). Segment only runs a destination whose key is in its settings, and there is no
  Segment cloud (the placeholder writeKey gets a 404), so `defaultSettings.integrations`, keyed by the
  plugin's own `key`, is the **only** thing that switches Firebase on. It was missing until 2026-09-14:
  no screen or event reached Firebase at all, only Firebase's automatic events. Segment's app-lifecycle
  events are off — Firebase records opens and sessions itself. `FirebaseIdentityPlugin`
  (`src/lib/firebaseIdentityPlugin.ts`), inside that destination, drops any identify that is not for
  the signed-in account — Segment holds events until its settings load, so a sign-out in that window
  used to replay the student's queued identify — and cuts the rest down to `pickSafeTraits`
  (`src/lib/safeUserTraits.ts`): Segment merges each identify with the traits it persisted, and
  builds up to v1.0.3 persisted a student's name, mobile and email. Those stored traits are also
  rewritten to the safe set once Segment's store has loaded.
- **Screen names come from the navigator.** `NavigationContainer`'s `onReady`/`onStateChange` in
  `App.tsx` call `analytics.screen(routeName)` (a Firebase `screen_view` whose screen name is the route
  name) and log a Crashlytics line (`Screen viewed:` / `Navigated to: <route>`). Firebase's automatic
  screen reporting is **off**: it recorded native classes (`RNSScreen`, `UIViewController`,
  `RCTFabricModalHostViewController`, `ScreenOrientationViewController`) instead of screens.
- **Privacy — users are minors.** Event parameters and user properties carry ids, content names
  (subject/lesson/quiz titles) and counts, never free text a user typed or anything identifying.
  `SafeUserTraits` is the whole trait set, enforced at the destination as above;
  `trackContactSupport` deliberately sends no subject. A forced sign-out (`handleSessionExpired`)
  resets analytics and the per-account flags (`resetSessionFlags`) just like `logout`, so the next
  person on the device — often a parent — is not tracked under the student's Firebase user id, nor
  handed the student's OTP skip or pending registration screen. `analytics.reset()` clears
  Firebase's user id and analytics data itself (`clearFirebaseIdentity`) on every sign-out:
  Segment's reset reaches only destinations it has added (once its settings load), its Firebase
  destination never clears the user id, and a failed Segment reset is silent in release builds —
  Segment resetting the data a second time is harmless. `AuthContext` tracks the live session and
  whose it is (`sessionRef`, closed first thing on sign-out; a server refresh settles whose it is,
  `storeServerProfile`): a profile refresh or profile write whose session has closed, or that
  belongs to another account than the live session's, is dropped — and undone while nobody is
  signed in if its write already reached the device — so a late reply cannot restore the account or
  re-identify the student, even after someone else has signed in.

### Boki AI Assistant (BKLT-221)
**Boki** (بوكي) is the student AI study assistant. Backend contract: `booki-graphql-api.md` (repo root, gitignored — keep local). Single request/response (`aiChat` mutation returns the full answer — **no streaming**).
- **Data layer is isolated** in `src/services/bokiApi.ts` (wraps `tryFetchWithFallback`) + raw ops in `src/graphql/boki.ts` + hand-written types in `src/types/boki.ts`. A contract change touches only these. Pure helpers: `src/utils/bokiErrors.ts` (`classifyBokiError` → `offline`/`rateLimit`/`backend`, `BokiApiError`) and `src/utils/bokiMessages.ts` (turn transforms) — unit-tested directly.
- **Global FAB** `src/components/boki/BokiFloatingButton.tsx` is mounted once in `App.tsx` (outside `NavigationContainer`), shown only for `isAuthenticated && userRole === 'student'`, route-aware via `navigationRef` with a hidden-routes denylist. The route-name state — and its `sync()` fallback on every nav-state change — both default unknown routes to `'Splash'` (a denylisted route) rather than `undefined`: `RootStack.Navigator` stays unmounted for the whole splash window (`AppNavigator`'s early return), so `getCurrentRoute()` has nothing to report and an unknown route must fail closed, or the FAB shows over the splash screen for a returning, already-authenticated student (BKLT-221 regression — fixing only the initial state was insufficient, since `sync()` re-fires as soon as `NavigationContainer` itself mounts, before `RootStack.Navigator` does, and would otherwise overwrite the safe default with `undefined` again). Exactly two screens — `BokiChat` + `BokiConversations` — are registered in `TabNavigator`'s inner stack; the message list is an **inverted FlatList** (turns stored newest-first, older pages via `onEndReached`). `useBokiChat()` owns turns/send/retry/history/feedback; selecting a conversation from history calls `navigation.popTo('BokiChat', { conversationId })` (go **back** to the single chat screen, never push a new one), and a route-param effect calls `loadConversation` to refill it; "new conversation" clears the thread in place and resets the param.
- **Connectivity**: `@react-native-community/netinfo` via `src/hooks/useNetworkStatus.ts` distinguishes offline from backend errors (NetInfo is a native module → dev-client rebuild needed). Rate limit is 10 req/min → 429.
- **Report + feedback** (Phase 3): each answer bubble has like/dislike (optimistic `aiChatFeedback`, toggles to NONE) + a Report button opening `BokiReportSheet` (fixed reason set `incorrect/irrelevant/offensive/other` — no backend reasons query — + optional notes → `aiChatReport`, confirmation via `ModalContext`).
- **Analytics** (Title Case, `feature: 'boki'`) via `analytics.trackBoki*` in `src/lib/analytics.ts`. testIDs: `boki-fab`, `boki-chat-input`, `boki-send-button`, `boki-message-list`, `boki-typing-indicator`, `boki-retry-button`, `boki-source-link`, `boki-history-button`, `boki-new-conversation`, `boki-conversation-list`, `boki-conversation-{id}`, `boki-like-button`, `boki-dislike-button`, `boki-report-button`, `boki-report-reason-{reason}`, `boki-report-submit`.
- **Reference-link deep-nav (BKLT-314)**: a source chip's `onPress` resolves `source.lessonId` via `BokiLessonById` (`lesson(id)` in `lesson.graphql`, plain `useLazyQuery` in `BokiChatScreen` — not part of the isolated `bokiApi.ts` layer, since it's a Lesson-domain op) and navigates to `StudyLesson` with `{ lesson, subject: lesson.chapter?.subject, fromBoki: true }`. Same `checkSubscription()` gate as `StudyChaptersScreen`'s chapter-list tap, and an `isLocked` lesson here raises the shared `showPremiumNotice()` — the same one the lesson lists now use (see *Trial & subscription access*). A null `lesson` or a failed query falls back to `boki.source_open_error`. `fromBoki` (like `fromBookmarks`) skips `StudyLesson`'s leave-disclaimer — there's no `allLessons`/study-session context to lose.
- **Status**: Phases 1–3 shipped (chat + errors/retry + history + new conversation + report + like/dislike + reference-link deep-nav). Backend exposes `conversations`/`conversationMessages` as queries, `aiChat*` as mutations (introspect before adding ops — the contract doc has been wrong once).

### Lesson mind map (BKLT-174, contract: `mobile-lesson-mindmap-svg.md` — local-only)
`Lesson.mindMapUrl` is **either** an AI-generated SVG **or** an editor-uploaded raster, and
`Lesson.mindMapMimeType` is the only way to tell — `<Image>` renders *nothing* for an SVG, so
picking the branch by file extension is a silent-blank bug (a generated map's storage URL need not
end in `.svg`). Branch via `resolveMindMapKind()` (`src/utils/mindMap.ts`):
`image/svg+xml` (trimmed, any case) → **`MindMapWebView`** fed by `useRemoteSvg`, anything else with a URL → **raster** via expo-image (the safe fallback for payloads
cached before the field existed), no URL → `'none'` and the section is not rendered at all.
- **Both fields must be selected by every query that can feed the reader** — `StudyChapters`,
  `MySavedPoints` and `BokiLessonById`. Miss one and that path silently falls back to the raster
  renderer, which draws nothing for a generated map.
- UI: `src/components/study/LessonMindMap.tsx` is the inline preview; tapping it navigates to the
  **`MindMapViewer` route** (`src/screens/study/MindMapViewerScreen.tsx`), registered in
  `TabNavigator` as a `fullScreenModal` with `orientation: 'landscape'` and on the Boki FAB
  denylist. An SVG map renders in `src/components/study/MindMapWebView.tsx` in both places (zoom
  locked in the preview; WebKit's own pinch-zoom up to 5× in the viewer, set by the viewport in
  `src/utils/mindMapHtml.ts` — on iOS it has no double-tap zoom). A raster keeps expo-image, with
  RNGH pinch/pan/double-tap in the viewer — which is why the viewer mounts its own
  `GestureHandlerRootView`: the app has none at its root, and the viewer is its only RNGH user.
  Both surfaces load through `useMindMapLoad` (`src/hooks/useMindMapLoad.ts`: download + render
  status, one retry that downloads again after a failed download and remounts after a failed render;
  a render result belongs to one map, kind and attempt, so a lesson that moves from the raster
  fallback to SVG once its MIME type arrives starts over, and a late callback from a replaced view or
  an earlier attempt is ignored) and share `MindMapErrorCard`.
- **Orientation is owned by react-native-screens, per screen.** Every stack navigator declares
  `orientation: 'portrait_up'` in its `screenOptions` (root, student, parent) and only
  `MindMapViewer` declares `landscape`, so the OS rotates when the viewer appears and back when it
  is popped by any route — the close button or Android back. The generated canvas is ~2:1, so a
  portrait "fullscreen" would letterbox to barely more than the inline preview. **Nothing calls
  `ScreenOrientation.lockAsync` for the viewer any more**: the old Modal-plus-lock design issued
  locks while the modal was still animating and raced a second orientation request from the
  presentation machinery, which is why the app sometimes stayed sideways. Before the navigator
  mounts, iOS holds portrait through the Info.plist default (`initialOrientation: PORTRAIT_UP` of the
  `expo-screen-orientation` plugin in app.json, applied from the first frame) and Android through
  App.tsx's `lockAsync(PORTRAIT_UP)` — Android only, because on iOS that lock stays registered for
  the whole process and expo re-applies it on every foreground.
  `app.json > orientation` stays `"default"` — the plist must advertise landscape or the viewer
  cannot rotate.
- **One download per map.** An SVG goes through `useRemoteSvg` (`src/hooks/useRemoteSvg.ts`):
  cached per URL and **shared while in flight** (a viewer opened mid-download joins the preview's
  request), handed out **as downloaded**, cancelled when its last consumer leaves. Every consumer
  keeps its own copy of what it shows — the cache is budgeted by size, least recently used out first
  (`MAX_CACHED_CHARS`: three maps at ~775 KB each on Hermes, which stores Arabic text as UTF-16, with
  room for bigger ones, or a whole quiz's images, which share it) — so an eviction never turns a map
  on screen back into a spinner. A file bigger than the whole budget (no map comes close) is kept on
  its own instead of being dropped, so it is still downloaded only once.
  It times out after 30 s (`createFetchWithTimeout`, `src/lib/fetchWithTimeout.ts`, shared with
  Apollo) and treats a body that is not an SVG as a failure, so a stalled network or a captive
  portal ends in the retry card; `retry` re-downloads even after a load. Its state is derived per
  URL and `LessonMindMap` keys its preview by the map URL, so after an in-place lesson swap no
  render shows the previous map as loaded (that once fired "Mind Map Viewed" early). Never `SvgUri`
  — it downloads per mounted instance and cannot be cancelled, so one visit used to download and
  mount the map three times (preview, viewer, preview again on close). The reader passes
  `active={contentReady}`, so the map — SVG download or raster — waits for the opening transition.
- **Why a WebView and never react-native-svg for the mind map.** react-native-svg draws on the
  app's **main thread** and redraws the whole map on mount, every time it scrolls back into view and
  on every rotation; the newer generator (2026-09) also puts a `feDropShadow` filter on 35
  elements, which react-native-svg renders through **CoreImage on the CPU, per element, per draw**.
  Profiling the lesson open-and-scroll on the simulator (`sample`, 25 s, 2026-09-14) put 7.6 s of main-thread
  time in that drawing, 5.8 s of it CoreImage — the "freeze until the video loads". A WebView renders
  in its own process: zero main-thread drawing, the embedded Cairo font, shadows and Arabic/number
  direction render as designed, and zoom stays vector-sharp. `react-native-webview` (13.15.0, the
  SDK 54 version) is a **native** dependency — adding or upgrading it needs a dev-client rebuild.
  `MindMapWebView` runs with JavaScript off, refuses every navigation away from its own document (any
  link inside the SVG), and remounts itself if the OS kills its content process (which leaves a
  blank white view on iOS and an unusable one on Android) — twice per spell in the foreground, then
  the retry card. On iOS a kill while the app is away (in the background, or on its way back) waits
  for its return and does not count — iOS reclaims a backgrounded app's WebView processes as a
  matter of course; Android restarts at once, since it requires a WebView whose renderer is gone to
  be replaced straight away.
- **`WebViewWarmup` (`src/components/WebViewWarmup.tsx`) stays mounted at App's root, inside the
  providers.** The first WebView navigation in an app session runs WebKit's single-sign-on check
  (`SOAuthorizationCoordinator::tryAuthorize`) synchronously on the main thread — 0.43 s profiled
  on the simulator, and it landed on the lesson as it opened, since the mind map was the first
  WebView a student met. The warm-up loads an empty document in a hidden 1×1 WebView for a
  returning student only, decided once the stored session has been read, while the splash screen
  still shows (after it: 3 samples at lesson open), and unmounts itself once loaded. A fresh sign-in
  does not warm up — the stall would land on the move to Home or on typing the code — so the first
  mind map after one pays the 0.43 s once. Parents and signed-out users never meet
  a WebView, so they don't pay for one. **iOS only**: Android has no such check, and a WebView built
  early crashes the app outright on a phone whose system WebView is being updated or is disabled
  (react-native-webview does not guard the constructor) — a risk for the lesson that shows a map,
  not for app start.
- **`normalizeSvgXml` (`src/utils/svgCompat.ts`) is for react-native-svg consumers only** — quiz
  images (`QuestionImage`). It drops filters (the CoreImage main-thread cost above), the base64
  `@font-face` `<style>` block, decodes `&apos;`/`&gt;` in text only (a
  decoded `'` inside a single-quoted attribute breaks the file), and merges runs of bare `<tspan>`s
  that react-native-svg would lay out on top of each other — never a styled or positioned one. Never feed its output to the WebView,
  which renders all of these correctly. If the generator changes shape again, extend that function
  and its tests first.
- Analytics: `trackMindMapViewed` fires once the map has rendered (load-based, not viewport-based),
  once per lesson per reader visit; `trackMindMapZoomed` on every viewer open. testIDs:
  `study-mindmap`, `study-mindmap-retry`, `study-mindmap-viewer`, `study-mindmap-viewer-web`,
  `study-mindmap-viewer-retry`, `study-mindmap-viewer-close`.
- ✅ **Release gate cleared**: `mindMapMimeType` is now live on all three environments (re-checked
  2026-08-23 via `npm run check:release-fields`). The general rule stands — a query selecting an
  unknown field fails *entirely* — so run that script before any store build.
- Generation is async: a new lesson can return `mindMapUrl: null` and get one minutes later — never
  cache "this lesson has no map".

### Lesson reader: keep the first frame cheap
- `StudyLessonScreen` paints the header and summary first; the video player and the key-point list
  mount, and the mind map loads, only once `useAfterTransition()` (`src/hooks/useAfterTransition.ts`)
  flips, with skeletons until then, so the opening transition itself stays light. The hook listens
  to native-stack's `transitionEnd` (600 ms fallback). **Not `InteractionManager`**: on RN 0.81 it
  is a stub that runs on the next tick and no navigator registers interactions, so the first version
  of this hook deferred nothing. (The multi-second freeze blamed on "the video loading" was the mind
  map's main-thread drawing — see the WebView bullet above; the video's load is asynchronous.) Use
  the same hook for any screen that opens with a heavy tree.
- On open the reader refreshes bookmark/note state with **`MySavedPointFlags`**, not
  `MySavedPoints`: the latter carries the whole lesson once per saved point, so in the reader it is
  only for the bookmark deep-link (`fetchLessonDetails`); Bookmarks/Notes still lists from it. Every
  lesson-scoped fetch and the like/dislike reply are checked against `currentLessonIdRef`
  (`isStale()`) before they touch the screen, loading flags included — the reader swaps lessons in
  place, so a slow reply for the previous lesson must not land on the next one or switch off its
  spinner. The key-points spinner follows the latest details request (`detailsRequestRef`), so
  neither a stale fetch nor an earlier one for the same lesson (after A → B → A) switches it off
  early, and a lesson that needs no fetch switches it off itself. Bookmark/note replies are keyed by
  point id, so a late one cannot touch the next lesson's rows.
- No `LayoutAnimation` on the lesson swap (Next/Previous): animating the whole content tree
  re-laid out the video, the map and every card at once.

## Trial & subscription access (backend contract: `mobile-trial-restrictions.md` — local-only)
The server owns every access decision; the app only interprets. A student is on a **trial** from
signup (bounded by ops-tuned `.env` values — PRS currently runs a **120-day** trial, so **never
hardcode 7 or 2**), then either subscribed or locked out.
- **`TrialStatus` (`src/graphql/trial.graphql`) is deliberately its own query.** The five fields
  (`on_trial`, `trial_ends_at`, `trial_days_remaining`, `daily_quiz_limit`,
  `remaining_quizzes_today`) are live on **PRS only** — not demo, not production (checked
  2026-08-23). Folding them into `Me`/`Login`/`Register` would make **sign-in itself fail** on
  those environments, since an operation selecting an unknown field fails in full. Keep them out
  of every auth document; gate store builds on `npm run check:release-fields`.
- **One fetch, one provider**: `TrialStatusProvider` (`src/context/TrialStatusContext.tsx`) wraps
  the app; `useTrialStatus()` reads it. `status` is `null` for "unknown" (parent, signed out, or an
  environment without the fields) and every consumer must **fail open** on it.
- **`null` ≠ `0`**: for `daily_quiz_limit`, `null` is *unlimited* and `0` is *no access*. Use the
  predicates in `src/utils/trialStatus.ts` (`isUnlimitedQuizzes`, `isQuizzingBlocked`,
  `hasQuizAttemptsLeft`, `isLockedOut`) — a bare `<= 0` or `?? 0` locks out exactly the students
  who paid.
- **Freshness**: `is_subscribed` cached at sign-in goes stale both ways (a lapsed trial keeps
  passing the gate; an activated plan keeps failing it). `refreshUser()` runs at launch and on
  every foreground (`useAppForeground`); the trial query refreshes on foreground, on Home's focus
  window, and after every `startQuiz`.
- **Locks come from `Lesson.isLocked` only** — never from an index or from `on_trial` (a per-subject
  plan mixes locked and unlocked rows on one screen). A locked row must *say something*: tapping one
  raises `useSubscriptionGate().showPremiumNotice()` instead of the silent no-op it used to be.
  **Every** way into a lesson is gated — the study chapter list, the in-reader lesson switcher, Boki
  source chips, and **Bookmarks/Notes**. That last one is easy to miss: a bookmark outlives the
  access that created it, so `MySavedPoints` selects `isLocked` too and the reader is not opened
  when it is true (otherwise an expired student reads a blank page, since the server redacts
  `summary`/`points` for a locked lesson).
- **`startQuiz` failures** carry no `extensions.code`, so branch on *shape*, not wording
  (`src/utils/quizStartErrors.ts`): `extensions.validation.lessonIds` ⇒ locked lesson ⇒ our list is
  stale, so refetch `LessonsForSubject` and pop back to the **picker** (the settings screen's route
  params still hold the rejected lesson), where `QuizLessonsScreen` prunes any now-locked selection;
  any other GraphQL error is the daily cap. **Never auto-retry.** An attempt is spent on **start**,
  not submit, and a resume costs nothing — so re-read `remaining_quizzes_today` after every start
  instead of counting locally.
- ⚠️ **No new paywall UI, by product decision.** There is no subscription/plans screen, no trial
  countdown banner and no quiz counter — no IAP is planned and selling from inside the app is a
  store-policy problem (Apple 3.1.1). **Every** refusal — locked lesson, locked-out account, daily
  cap reached, `startQuiz` rejected — shows the app's one existing premium notice
  (`subscription.required_title` / `required_message`), and that block of locale keys holds exactly
  those two strings. This is a deliberate deviation from the contract's §2 "Suggested UI" and its
  §5 "route to the subscription screen": the *logic* is implemented in full, only the surfaces are
  not. The server's own refusal text is logged rather than shown, so support can still tell which
  limit was hit.

## Auth error messages
Login/register failures show the **server's** message verbatim: the backend localizes by our `lang`
header on all three environments ("The provided credentials are incorrect." / "بيانات الدخول مش
صح."). `classifyAuthFailure`/`authFailureText` (`src/utils/authErrors.ts`) return the server text
when there is one and a bundled key only for transport/unknown failures. **Never re-word or
sharpen it** — the substring-matching that turned the generic refusal into "no account found"
leaked whether a number is registered (removed with `auth.no_account_found` /
`auth.incorrect_password`). Shared GraphQL-error reading lives in `src/utils/graphqlErrors.ts`.

## WhatsApp OTP (backend contract: `mobile-otp-guide.md` — a local copy from the backend team, deliberately not committed)
Four **scoped** flows — student/parent × verify/reset. A code only works with its matching consume mutation, so **every flow starts with a fresh send**; never reuse one across screens. On non-prod the code is always `123456`.
- **Screens**: `OTPVerificationScreen` (signup verification, both roles) and `ForgotPasswordScreen` (password reset, both roles) each take an `audience: 'student' | 'parent'` route param that selects the account, the documents, and the timer scope. `ForgotPasswordScreen` also takes `fromProfile` and serves three routes: `ForgotPassword`, `ParentForgotPassword`, and the authenticated `ResetPassword`. The 6-digit field is the shared `src/components/OtpCodeInput.tsx`.
- **Gate**: `AppNavigator` renders *only* `OTPVerification` while `mobile_verified_at` is null and verification isn't skipped — for **both** roles. `register`/`login`/`parentRegister`/`parentLogin` all auto-send when unverified, so AuthContext sets `otpWasAutoSent` and the screen must **not** send again (it would burn the 3-per-hour budget). `otpShouldAutoRequest` is only for the profile "verify now" banner (BKLT-276).
- **Timers**: `useOtpTimer(scope)` — scope is one of `student-verify`/`parent-verify`/`student-reset`/`parent-reset`, each with its own storage key so flows can't cross-contaminate. It derives **two** countdowns from one send stamp: a fixed 60s resend lock (`timeLeft`/`isActive`) and the code's own life (`expiresLeft`/`isExpired`) from the response's `expires_in`. **Never hardcode a countdown.**
- **Send allowance (BKLT-287)**: `useOtpTimer` also counts codes spent per number (`sendCount` /
  `hasReachedSendLimit`, cap `MAX_OTP_SENDS = 3`), persisted with the send stamp so killing the app
  cannot hand out a fresh allowance. At the cap `ForgotPasswordScreen` disables resend and offers
  **Contact Support** — which is why `ContactUs` is registered in the **unauthenticated** root stack
  too (`sendContactMessage` needs no session; verified against PRS + demo). The counter resets when
  the number changes or `clearTimer()` runs. This is the UX cap; the backend keeps its own budget.
- **Rate limits**: a send's `success: false` means rate-limited and nothing else — show the server `message` (they arrive pre-translated; display as-is) and **never auto-retry**.
- **Anti-enumeration**: a send's `success: true` says nothing about whether the account exists. Always advance to the code step, and never word anything as "we found your account".
- **After a reset the server revokes every token**, including ours: clear it and route to login (`logout()` for the in-profile path). Never auto-login. Reset failures arrive as either `success: false` *or* a top-level GraphQL error (password policy) — handle both.
- **Digits**: user-typed numbers go through `digitsOnly()` / `normalizeDigits()` (`src/utils/digits.ts`). A bare `[^0-9]`/`\d` strip is ASCII-only and silently deletes an Arabic-Indic code or mobile number.
- **One password path only (BKLT-287)**: the WhatsApp **OTP reset**
  (`profile-reset-password-button` → `ResetPassword` route). The in-profile *change-password* form
  (`updatePassword` mutation) was **removed** — it duplicated the reset with weaker guarantees and
  its own validator. There is no signed-in "I know my current password" flow any more; every
  password change goes through the code and **ends signed out**, because the server revokes every
  token on reset. Do not reintroduce `updatePassword`.

## Quiz question types
`Question.type` is one of six values: `mcq`, `true_false`, `what_happens`, `give_a_reason` (both AI-graded free text), `match`, `paragraph`. **`image` is NOT a type** — `imageUrl` is an attachment orthogonal to `type` and can appear on any question, including paragraph children (render it via `src/components/quiz/QuestionImage.tsx`, which routes **SVGs to `react-native-svg`'s `SvgAst`** — downloaded once by `useRemoteSvg`, passed through `normalizeSvgXml` and parsed once in the component (a file the parser rejects shows the retry card; `SvgXml` would report it from inside its own render); expo-image and RN `<Image>` can't decode them — and raster formats to **expo-image** for caching). Branch on `type` (guards in `src/utils/quizQuestionTypes.ts`), never on `answers.length`.
- **Scoring is unit-based, not question-based.** `score`/`totalQuestions` count *units*: mcq/tf/descriptive = 1, `match` = one per pair, `paragraph` = sum of its children. Never label `totalQuestions` "questions" in the UI — show it as a score (`formatScore()` in `src/lib/scoreUtils.ts` — `score` is a Float). `xp` is server-derived (10/correct unit) — never compute it client-side.
- **Submit: exactly one entry per TOP-LEVEL question.** Paragraph children nest in `subAnswers`; match echoes the server's `leftId`/`rightId` verbatim; unanswered → `selectedAnswer: null`. This invariant lives in `buildSubmitPayload` (`src/utils/quizAnswers.ts`) — it iterates the question list, so don't hand-build the answers array. The taking screen holds a `QuizDraft` (discriminated union: `text` | `match` | `paragraph`), not the old flat `{[id]: string}`.
- **Results `userAnswers` is FLAT, in units**: a paragraph parent has NO row (children carry `parent_question_id`); a match is one row with `match_results`. Regroup with `groupUserAnswers` (`src/utils/quizResultGroups.ts`) on the review screen. `answer_1` is **null** for match/paragraph — null-guard it. The correct match pairing is the index-aligned `matchColumns` (`left[i]` ↔ `right[i]`, unshuffled in results).
- **Match UX** (`src/components/quiz/Match*.tsx`, mirrors the mockups): tap-to-pair with an SVG wire board (short items) or a slots + bottom-sheet picker (long items). Tapping a linked card unlinks and re-arms it — there is deliberately **no one-tap steal** on the wire board (the pure state machine is `matchTap` in `src/utils/matchInteraction.ts`). Submit is blocked until every left item is paired (consistent with the app's no-skip flow).
- **Choosing question types at setup** (backend contract: `mobile-quiz-question-type-selection.md`, local-only like the OTP guide): `QuizSettingsScreen` runs `lessonQuestionTypes(lessonIds:)` and renders **only** the types it returns. Each type's `count` drives validation but is **not shown** (BKLT-397 — product asked for the per-type numbers to be hidden); a type with no questions is omitted from the response, never returned as `count: 0`, so **never pad the picker from a hardcoded list**. Read `minSelectedTypes` from the response, never hardcode 2. Selecting **every** type is the default "all types" mix, and `startQuiz` then **omits** `questionTypes` entirely rather than listing them. Not choosing at all is `null`; a selection the student has *emptied* is `[]`, which is deliberately **not** the default — it blocks Start with the min-types message instead of silently handing back the full random mix. The rules are pure functions in `src/utils/quizTypeSelection.ts` — Start is blocked (with the shortfall shown) when Σ selected counts < the chosen quiz size, and a stale selection is pruned when the lesson set changes. `image` is a **selectable category here** even though it is not a `Question.type`: it means "an mcq/true_false carrying an image", and those rows are counted under `image` and *not* under `mcq`, so the buckets never double-count.
- The quiz **taking** surfaces are intentionally light-only (palette: `QUIZ_COLORS` in `src/config/colors.ts`, plus `MATCH_PAIR_COLORS`); the review screen stays theme-aware. Submitting uses a longer per-op timeout (`SUBMIT_QUIZ_TIMEOUT_MS`, passed via `context.fetchOptions`) because descriptive grading is synchronous. Apollo needs `MatchColumnItem: { keyFields: false }` — those ids (`L0`/`R0`…) repeat across questions and would otherwise collide in the cache.

## Feature switches (`src/config/features.ts`)
Build-time switches for **finished** work that is not being launched yet. Not debug flags — they
ignore `debugMode` and behave the same in every environment. Flip the constant, rebuild, done.

### `STUDY_PLAN_ENABLED` — **off**
The study plan / weekly calendar is hidden from the mobile app; **not launching for now.**

⚠️ The mobile implementation is **complete, not a stub** — do not "finish" it or rebuild it.
`StudyCalendarScreen` adds a subject to a day, removes one, picks the subject, sets lesson/quiz
goals, and persists the whole week via the `SaveStudySchedule` mutation. It is **not** a read-only
mirror of a plan built on the web. Nothing was deleted when it was hidden; setting the flag to
`true` restores the feature exactly as it was.

The flag gates three things — all of them, or it leaks:
1. **Home's "Today's Plan" card** *and* its `TodaySchedule` query. The query is `skip`ped, and the
   focus-refresh `Promise.all` gates its `refetch()` separately: **`refetch()` ignores `skip`**, so
   without that guard the unlaunched feature still hits the network on every focus.
2. **The `StudyCalendar` route** in `TabNavigator` — deliberately not *registered*, so the screen is
   genuinely unreachable rather than merely unlinked.
3. Any `navigation.navigate('StudyCalendar')` call site.

`src/components/TodaysPlanWidget.tsx` also navigates there but is **mounted nowhere** (dead code as
of this writing) — gate or delete it if you ever mount it.

## Static pages (BKLT-300)
About Us and the legal pages Paymob requires (terms, privacy, refund, shipping) come from the CMS
via `page(slug:)` (`src/graphql/pages.graphql`) and render in `StaticPageScreen`, linked from
Profile → **About & Legal** (student) and Parent Settings (parent).
- **Public, plain text.** The query needs no token. The body is plain text in `content_en` /
  `content_ar` — not HTML, and not localized by the `lang` header — so `pickLocalizedBody()` picks
  the UI language and falls back to the other. `parseStaticPage()` (`src/utils/staticPage.ts`) turns
  its line shapes into blocks: `•\t` bullet, number-dot-**tab** step, number-dot-**space** heading,
  and a short unpunctuated line as a heading (About Us's "Our Story"). No web view.
- **The menu is `STATIC_PAGES`** (`src/config/staticPages.ts`), never the CMS `pages` list: its
  `order` is 0 for refund/shipping so they would sort first, its `icon` values are web heroicons,
  and a page added to the CMS later should not appear in the app unannounced. Labels are bundled
  (`static_pages.*`), so the menu and header need no fetch.
- **A missing slug is `page: null`, not an error** → the screen's "unavailable" state; an
  `is_active: false` page is treated the same. Demo has no refund-policy / shipping-policy (checked
  2026-09-12); PRS and production have all five. `check:release-fields` requires `Query.page` and
  the three selected `Page` fields.
- Registered for signed-in students (`TabNavigator`) and parents (`ParentTabNavigator`) only.
  Nothing links to it while signed out yet — a signup "you agree to the Terms" line would need a
  registration in `AppNavigator`'s unauthenticated group too, like `ContactUs`.

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
| `npm run check:release-fields` | Pre-store-build: does **production** have every field the app cannot work without? Fails on those; only warns for fields whose query is built to degrade (the trial five). `--url` for another env |
| `npm run build:apk` / `build:aab` | Android release builds |

## Testing

### Unit tests (Jest + React Native Testing Library)
- Live in `src/__tests__/` (`auth/` for screens+context, `hooks/`, `lib/` for pure utils). Preset `jest-expo`, setup in `jest.setup.ts`.
- Render through `src/__tests__/helpers/renderWithProviders.tsx`; shared mocks in `src/__tests__/__mocks__/` (navigation, expo-secure-store, react-i18next — `t()` returns the key, so assert on translation keys like `'auth.fill_all_fields'`).
- Pattern: mock `apolloClient` (or pass `apolloMocks` to `renderWithProviders`, which wraps every render in `MockedProvider`) plus `ModalContext`, then assert user-visible behavior — validation errors, navigation, what the user sees. Don't assert that a fetch happened, and don't test styles.
- Prefer extracting pure logic into `src/utils/` and testing it directly over mock-heavy hook tests. Shared validators (`src/utils/validators.ts`) and the linking slot state-machine (`src/utils/parentSlots.ts`) are the single sources of truth — import them; never re-inline a copy.

### E2E tests (Maestro)
- Flows in `e2e/auth/` (numbered `01_...yaml`), shared subflows in `e2e/utils/` (`setup-environment.yaml` boots + self-heals to the Onboarding screen and switches env based on `TARGET_ENV`).
- `e2e/study/01_lesson_mindmap.yaml` walks the lesson reader and mind map (Revision tab → Social Studies → first lesson → scroll → fullscreen viewer → close), starting from a signed-in student's Home. **Rotation gotcha:** Maestro judges visibility against the *device's* frame, so a screen that rotates only the app (the landscape `MindMapViewer`) reads as off-screen until the flow turns the device too — `setOrientation: LANDSCAPE_LEFT` after opening it, `PORTRAIT` after closing.
- Credentials/env vars in `e2e/env.yaml`; runner `scripts/run_maestro.py` injects them and generates random mobile numbers for PRS/dev registration runs. **Never put real production passwords in `e2e/env.yaml`.**
- **testID convention: kebab-case `{screen}-{element}`** — e.g. `login-mobile-input`, `register-submit-button`, `onboarding-get-started`, `tab-home`, `confirm-modal-ok`, `profile-completion-skip-button`. Every new interactive element gets one.
- Prefer `extendedWaitUntil`/`assertVisible` with timeouts over fixed sleeps (`sleep.js`) — fixed sleeps make flows slow and flaky.
- Known popups a flow must tolerate (use conditional `runFlow when: visible:`): iOS "Not Now" system dialog, rate-limit/warning `confirm-modal-ok`, profile-completion prompt (`profile-completion-skip-button`), register disclaimer (`register-disclaimer-continue-button`), OTP screens (skip via `otp-skip-debug` / `otp-skip-debug-2`).
- Registration E2E runs on **all** envs (student `01` + parent `04` register on prod too). PRS/dev get random mobiles from `run_maestro.py`; prod uses the controlled `PROD_*` numbers in `env.yaml` and the universal test OTP `123456`. **Prod runs create real throwaway accounts — delete them afterwards.**
- **Password policy: registration requires minimum 8 characters, nothing else required** (no mandatory uppercase/digit/special — `PASSWORD_REGEX` in `src/utils/validators.ts`, used by `RegisterScreen`/`ParentRegisterScreen` and the new-password step of `ForgotPasswordScreen`; BKLT-297, supersedes the earlier 6-char BKLT-284 rule). Matches the backend, which rejects passwords shorter than 8 at registration. Login screens keep a looser 6-char soft-gate (they don't re-validate policy; the backend is the authority). The register hint key is `auth.password_min_8`; login still uses `auth.password_min_6`. The E2E password (`DemoPass1!`) still satisfies it. On a **prod build** the password fields default to secure (`showPassword = isDebugMode()` → false) and Maestro drops special chars in iOS secure fields, so prod flows first tap the show-password toggle (`*-password-toggle`) — guarded by `TARGET_ENV == 'prod'` since debug builds render them visible already.
- **Name policy (BKLT-318)** — `src/utils/validators.ts` is the single source of truth for both person and place names; never re-inline a character-class copy. Two policies, differing only in digits: `isValidPersonName`/`sanitizePersonName` (min 3, **no digits**) for the registration name field, and `isValidPlaceName` (min 2, **digits allowed**) for user-suggested cities/schools — `6th of October City` / `مدينة ٦ أكتوبر` are real cities. Both allow Latin + Arabic letters, tashkeel, and `space - ' .` (not at an edge, never doubled); max 60. Use explicit `\uXXXX` ranges, **not** `\p{L}` — an unsupported property escape is a bundle-load parse error on Hermes, and the hyphen must stay last in an assembled class or it reads as a range. The picker search box is deliberately **unfiltered** so existing entries stay findable; the gate is the add row (`shouldOfferAddNew`) plus `addCity`/`addSchool`. This is a UX/data-quality guard, **not** a security boundary — the backend still owes its own validation.

## Documentation policy (keep docs lean + true)
- **`CLAUDE.md` is the single source of truth** for project conventions. Update it in the *same commit* as any change to behavior/commands/conventions it documents.
- The only living, git-tracked agent docs are: **this file** + **`e2e/PARENT_JOURNEY.md`** (parent-flow map). `README.md` stays for humans.
- Do NOT add narrative / handover / one-off status docs to git — keep them local (gitignored, like `handover_summary.md`). Don't create a second architecture doc; fold it here instead.

## Review gate — run before every commit
There is **no automatic git hook**; the developer runs this gate **manually** before each commit:
1. **`npm run guardme`** (codegen drift check + lint + `tsc --noEmit` + jest + docs-link check) — must pass. **Agents must run this on what they change** — never hand back a tree that fails it.
2. **`/code-review`** on the changes — address its findings before committing. This is a built-in only the *developer* can trigger; the model cannot invoke it, so an agent must say plainly that this step is still outstanding rather than implying the diff has been reviewed.
3. Run the relevant guard skill on what changed and fix its findings:
   - **clean-code-guard** → changed production code
   - **test-guard** → changed test files
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
- ❌ Hardcode user-facing strings — use `t()` with keys in `src/i18n/locales/ar.json` + `en.json`
- ❌ Mix Prettier-only reformatting into feature/test commits
