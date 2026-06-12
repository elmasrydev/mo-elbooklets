# Parent Journey Map (code-derived — verify on simulator before writing flows)

> Built by reading the code (`AppNavigator.tsx`, `AuthContext.tsx`, parent screens, hooks).
> ✅ = confirmed in code. ❓ = needs one manual simulator walkthrough to confirm timing/behavior.

## Key differences from the student journey

| | Student | Parent |
|---|---|---|
| OTP screen | Yes (skip via `otp-skip-debug`/`-2`) | **NO — never** ✅ (`AppNavigator.tsx:47` routes `userRole === 'parent'` straight to dashboard; `parentLogin`/`parentRegister` in AuthContext have no verification redirect) |
| Profile-completion prompt | Yes (`profile-completion-skip-button`) | **NO — never** ✅ (`AppNavigator.tsx:91` excludes parents) |
| Registration success screen | Possible | No (non-parent only) ✅ |
| Post-auth landing | Home tabs (`tab-home`) | `ParentDashboardScreen` ✅ |
| Logout location | Profile tab → scroll → `profile-logout-item` | Dashboard → settings gear → `parent-settings-logout-item` ✅ |

## Parent-side journey

```
Onboarding (onboarding-parent-tab)
 ├─ Get Started → ParentRegister (all testIDs exist: parent-register-name/-mobile/-email/-password/-confirm/-submit)
 │    └─ submit → authenticated → ParentDashboard  (NO OTP, NO disclaimer modal in code ❓ confirm)
 ├─ Sign In → ParentLogin (testIDs exist: parent-login-mobile/-password/-submit)
 │    └─ submit → ParentDashboard
 └─ Forgot → ParentForgotPassword

ParentDashboard
 ├─ header settings gear → ParentSettings → parent-settings-logout-item → confirm-modal-ok → Onboarding
 ├─ FAB (person-add icon) → Add-Child Modal (native Modal)
 │    ├─ mobile input (11-digit, digits only)
 │    └─ confirm → ParentSendLinkRequest mutation → request shows as PENDING
 ├─ Incoming link requests section → Accept / Decline buttons (ParentRespondToLink)
 ├─ Outgoing pending requests → Cancel (ParentCancelLinkRequest)
 └─ children list → tap child card → navigate('ChildDetailsScreen') — screen NOT IMPLEMENTED yet
    (per product owner: ignore for now; do not test or "fix" this navigation)
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

## Missing testIDs (add before writing flows — kebab-case `{screen}-{element}`)

| Screen | Element | Suggested testID |
|---|---|---|
| ParentDashboard | settings gear (header) | `parent-dashboard-settings-button` |
| ParentDashboard | add-child FAB | `parent-dashboard-add-child-fab` |
| ParentDashboard | modal mobile input | `parent-dashboard-child-mobile-input` |
| ParentDashboard | modal confirm btn | `parent-dashboard-add-child-confirm` |
| ParentDashboard | modal cancel btn | `parent-dashboard-add-child-cancel` |
| ParentDashboard | accept / decline / cancel on request cards | `parent-dashboard-request-accept` / `-decline` / `-cancel` |
| ParentDashboard | empty state / child card | `parent-dashboard-empty` / `parent-dashboard-child-card` |
| ProfileScreen (student) | "Parental Linking" row | `profile-parent-linking-item` |
| ParentLinkingScreen + ParentSlotCard (student) | accept/decline/slot elements | `parent-linking-*` |

## Bugs in the existing draft flows (04/05/08)

1. **04 + 05 + 08 assert `parent-settings-logout-item` right after register/login** — wrong:
   that element is on ParentSettings; the app lands on ParentDashboard. Assert a dashboard
   element instead (needs the dashboard testIDs above), then tap the settings gear before logout.
2. **08_parent-logout.yaml runs `setup-environment` twice** (before and after `launchApp`);
   the first call runs against a stale app state — delete it.
3. **04 register draft enters email `parent@maestro.com`** every run — if the backend enforces
   unique parent emails, repeat runs will fail ❓ → runner should generate a random email like it
   does mobiles, or backend must allow duplicates.

## Other notes for flow writing

- Parent password rule: `isDebugMode() || password === 'demopass'` mirrors student rules
  (`ParentRegisterScreen.tsx:66`).
- All error popups go through the global ConfirmModal → dismiss with `confirm-modal-ok`.
- The add-child modal is a native `<Modal>` — fine for Maestro (same as ProfileCompletionPrompt).
- ⚠️ `e2e/env.yaml` PRS student + parent mobiles are FIXED accounts used by login flows (02/03/06).
  The link flow should use the run's random mobiles instead, so cleanup stays simple.

## Manual walkthrough checklist (the ❓ items)

1. Parent register on PRS: any disclaimer/popup after submit? (code shows none)
2. Parent register: does backend send WhatsApp OTP anyway / any server-driven modal?
3. Add child with a non-existent mobile → which error copy/modal appears?
4. Add child twice with same mobile → duplicate-request error behavior?
5. Student side: does the request appear instantly or after pull-to-refresh?
6. Accept on student side → does parent dashboard need refresh to show the child?
7. Rate-limit modal frequency on parent login (PRS)?
