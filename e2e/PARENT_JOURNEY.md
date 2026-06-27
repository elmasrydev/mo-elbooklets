# Parent Journey Map (code-derived)

> Built by reading the code (`AppNavigator.tsx`, `AuthContext.tsx`, parent screens, hooks).
> **Status (2026-06-14):** flows 04/05/08 (parent auth) and 09 (parent↔child link) are
> implemented and passing on PRS and Demo. This doc is kept as the reference map.
> ✅ = confirmed in code.

## Key differences from the student journey

| | Student | Parent |
|---|---|---|
| OTP screen | Yes (skip via `otp-skip-debug`/`-2`) | **NO — never** ✅ (`AppNavigator.tsx:47` routes `userRole === 'parent'` straight to dashboard; `parentLogin`/`parentRegister` in AuthContext have no verification redirect) |
| Profile-completion prompt | Yes (`profile-completion-skip-button`) | **NO — never** ✅ (`AppNavigator.tsx:91` excludes parents) |
| Registration success screen | Possible | No (non-parent only) ✅ |
| Post-auth landing | Home tabs (`tab-home`) | `ParentDashboardScreen` ✅ |
| Logout location | Profile tab → scroll → `profile-logout-item` | Settings tab → scroll → `parent-settings-logout-item` ✅ |

## Parent-side journey

```
Onboarding (onboarding-parent-tab)
 ├─ Get Started → ParentRegister (all testIDs exist: parent-register-name/-mobile/-email/-password/-confirm/-submit)
 │    └─ submit → authenticated → ParentDashboard  (NO OTP, NO disclaimer modal in code ❓ confirm)
 ├─ Sign In → ParentLogin (testIDs exist: parent-login-mobile/-password/-submit)
 │    └─ submit → ParentDashboard
 └─ Forgot → ParentForgotPassword

Parent bottom tabs (ParentTabNavigator): Dashboard · Requests · Add Child · Settings
 ├─ Dashboard tab (parent-tab-dashboard) → children list → tap child card → ChildDetailsScreen (childDashboard data)
 ├─ Requests tab (parent-tab-requests) → incoming Accept/Decline (ParentRespondToLink), outgoing Cancel (ParentCancelLinkRequest)
 ├─ Add Child tab (parent-tab-add-child) → opens Add-Child Modal (also openable from the dashboard "add another child" button)
 │    ├─ mobile input (11-digit, digits only)
 │    └─ confirm → ParentSendLinkRequest mutation → request shows as PENDING in the Requests tab
 └─ Settings tab (parent-tab-settings) → scroll → parent-settings-logout-item → confirm-modal-ok → Onboarding
```

## Student-side approval (required to complete a link!)

Linking is two-sided: parent sends request by student mobile → **student must accept**:
```
Student Home → Profile tab → "Parental Linking" row → ParentLinkingScreen (ParentSlotCard list)
  → accept/decline incoming parent request
```
A full link E2E therefore needs BOTH accounts in one flow: register student (random mobile A) →
logout → register parent (random mobile B) → add child A → logout → login student A →
approve → logout → login parent B → assert child visible.

## testIDs for these flows — ADDED (2026-06-14, kebab-case `{screen}-{element}`)

All now exist in the code and are used by flows 04/05/08/09:

| Screen | Element | testID |
|---|---|---|
| Parent tabs | bottom tabs | `parent-tab-dashboard` / `parent-tab-requests` / `parent-tab-add-child` / `parent-tab-settings` |
| ParentDashboard | "add another child" button | `parent-dashboard-add-another-child` |
| Add-Child modal | mobile input | `parent-dashboard-child-mobile-input` |
| Add-Child modal | confirm btn | `parent-dashboard-add-child-confirm` |
| Add-Child modal | cancel btn | `parent-dashboard-add-child-cancel` |
| Requests tab | request card actions | `parent-dashboard-request-accept` / `-decline` / `-cancel` |
| ParentDashboard | empty state / child card | `parent-dashboard-empty` / `parent-dashboard-child-card` |
| ChildDetailsScreen | hero / empty / error | `child-details-hero` / `child-details-empty` / `child-details-error` |
| ProfileScreen (student) | "Parental Linking" row | `profile-parent-linking-item` |
| ParentSlotCard (student) | accept/decline/cancel/accepted, suffixed by slot | `parent-linking-accept-{1,2}` / `-decline-` / `-cancel-` / `-accepted-` |

## Draft-flow bugs — FIXED (2026-06-14)

All three were fixed when flows 04/05/08 were wired up and verified green on PRS:

1. ~~04/05/08 asserted `parent-settings-logout-item` right after auth~~ → now assert the
   add-child tab after auth; logout routes via the Settings tab → scroll → logout.
2. ~~08 ran `setup-environment` twice~~ → duplicate call removed.
3. ~~04 used a fixed email~~ → `run_maestro.py` now generates a unique parent email per run.

## Other notes for flow writing

- Parent password rule: `isDebugMode()` relaxes the strong-password check in debug builds
  (`ParentRegisterScreen.tsx`); the old `|| password === 'demopass'` prod bypass was removed.
- All error popups go through the global ConfirmModal → dismiss with `confirm-modal-ok`.
- The add-child modal is a native `<Modal>` — fine for Maestro (same as ProfileCompletionPrompt).
- ⚠️ `e2e/env.yaml` PRS student + parent mobiles are FIXED accounts used by login flows (02/03/06).
  The link flow should use the run's random mobiles instead, so cleanup stays simple.

## Walkthrough answers (confirmed by product owner, 2026-06-12)

1. Parent register on PRS: **no popup/disclaimer after submit** ✅
2. Backend does **not** send WhatsApp OTP to parents ✅
3. Add child with non-existent mobile → **unknown error UI; discover during first test run**
   (flows must tolerate `confirm-modal-ok` conditionally)
4. Duplicate add-child request → **unknown; discover during first test run**
5. Student-side request visibility → **WORKS** ✅ (verified by flow 09 on PRS 2026-06-13:
   the parent's request appears on the student's Parental Linking screen as pending_incoming)
6. Parent dashboard after student accepts → **WORKS with pull-to-refresh** ✅ (flow 09 swipes
   to refresh, then the linked child card appears)
7. Parent login rate-limiting → **possibly not implemented on backend; keep the conditional
   `confirm-modal-ok` handler anyway (harmless if it never fires)**

## Testing scope (product owner decision)

E2E covers **Auth system + parent↔child linking only** for now. No dashboard analytics,
no child details (screen not implemented), no notifications testing.
