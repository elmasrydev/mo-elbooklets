---
name: booklets-review
description: The full ElBooklets review gate an agent can actually run — guard skills, npm run guardme (codegen drift + lint + tsc + jest + docs), a max-effort multi-dimension review fan-out with adversarial verification, then fixing the confirmed findings. Replaces the built-in /code-review, which the model cannot invoke. Use when the user says "review this", "review the diff", "run the review gate", "is this safe to merge", "/code-review", or before any commit/PR/merge in mo-elbooklets.
---

# booklets-review

The complete review gate for **mo-elbooklets**, end to end: mechanical gates → guard
skills → dimension fan-out → adversarial verification → ranked findings → **you fix them**.

## Why this exists

`/code-review` is a built-in Claude Code command that only the *user* can trigger — the
model cannot invoke it, and no configuration changes that. Step 2 of the CLAUDE.md review
gate was therefore un-runnable by an agent, which meant agents were committing through a
gate they had only partially executed. This skill reproduces that pipeline using `Workflow`
and `Agent`, which the model *can* invoke.

**Invoking this skill is your authorization to call `Workflow` for this task.**

If the user asks for `/code-review` and it errors out as blocked, run this instead and say
so in one line — do not fall back to reviewing by hand.

## Scope resolution

Single git repo. Resolve scope before anything else and state it in one line so the user
can correct it.

```bash
git rev-parse --abbrev-ref HEAD
git status --porcelain
git diff --stat main...HEAD
```

- **On a feature branch** → base is `main`, diff is `main...HEAD` **plus** uncommitted changes.
- **On `main` with uncommitted changes** → base is `HEAD`, diff is the working tree.
- **Nothing changed** → say so and stop. Never review unchanged code.

An explicit argument (a path, `staged`, `head`, a base ref) overrides all of the above.

`android/` and `ios/` are **generated** by Expo prebuild — never review them.
`src/generated/` and `src/graphql/schema.graphql` are codegen/`schema:pull` output — review
them only as *drift evidence* (a hand-edit there is itself a blocker finding), never for style.

## Run order

### 1. Mechanical gate

```bash
npm run guardme
```

That is codegen-drift check → lint → `tsc --noEmit` → jest → docs-link check, in that
order. **A failing gate is a finding at the top of the list.** Capture the real output;
never report a gate as passing that you did not see pass. If it fails early, the later
stages of `guardme` did not run — say which ones were skipped.

**Never run `npm run e2e:*`.** Maestro needs a device and real accounts; CLAUDE.md reserves
it for the developer. Review the YAML statically instead.

### 2. Guard skills

Run the three guard skills on the changed files, in this order:
`clean-code-guard` (changed production code) → `test-guard` (changed test files) →
`docs-guard` (changed `.md` docs). Cheap and deterministic; they catch the mechanical
problems before the expensive fan-out spends effort on them.

Carry their real findings into step 4's report. Do **not** fix them yet, and do not
re-report a guard finding that the fan-out also surfaces — dedupe by file + line.

### 3. Max-effort fan-out

```
Workflow({ name: "booklets-review", args: { base, head, scopeNote, changedFiles } })
```

`base`/`head` come from step 1's scope resolution; `changedFiles` is the
`git diff --name-only` list (the workflow gates dimensions on it, so pass it). One reviewer
per applicable dimension at `max` effort, then every finding through a 3-voter adversarial
refutation panel — only findings surviving ≥2 of 3 votes come back.

If `Workflow` is unavailable, fall back to parallel `Agent` calls with
`subagent_type: "booklets-reviewer"`, then verify each finding with two independent
skeptics. Say which path you took.

### 4. Report

Call `ReportFindings` **once**, `level: "max"`, ranked most-severe first, merged from steps
1–3. Do not also print the findings as prose.

Rank by:

> debug-gate widening / OTP-skip exposure / token or credential leak
> **>** GraphQL contract break (inline `gql`, hand-edited `src/generated` or `schema.graphql`, codegen drift)
> **>** data loss or auth/session correctness bug
> **>** plain correctness bug
> **>** quiz scoring/submit invariant break
> **>** missing test for new logic
> **>** i18n / RTL / font / design-token violation
> **>** simplification

### 5. Fix

After reporting, fix the confirmed findings yourself, highest severity first.

- Every fix that touches logic needs a test.
- **Re-run `npm run guardme` after fixing** and report the real result, including failures.
- Keep Prettier-only reformatting out of the fix commit (`STYLE:` commit per CLAUDE.md).
- Ask before changing a **published GraphQL operation's shape** or anything that alters
  what the backend receives — propose it, wait.

If the user asked only to review, stop after step 4.

## What reviewers must check (ElBooklets-specific)

These are the rules this codebase has actually been burned by. They are encoded in the
workflow's dimension prompts — keep both in sync if you edit either.

- **Debug gate:** the OTP skip and every debug affordance is gated by `isDebugMode()` from
  `app.json > extra.debugMode` **only**. Widening it (`__DEV__`, emulator detection, an env
  var) is a merge blocker — a prod build must never show OTP skip.
- **GraphQL discipline:** every operation lives in a domain `.graphql` file under
  `src/graphql/`, consumed as a generated typed document (`useQuery(XxxDocument)` /
  `apolloClient.query({ query: XxxDocument })`). No inline `gql` tags or query strings in
  screens. `src/generated/*` and `schema.graphql` are never hand-edited.
- **Partial responses:** the client runs `errorPolicy: 'all'`, so a response can carry data
  *and* field-level errors. Gate error states with `loadFailureMessage()`
  (`src/utils/queryError.ts`) — only a response with **no** data is a load failure. Never
  blank a screen that has something to render.
- **OTP contract** (`mobile-otp-guide.md`): codes are scoped to purpose+audience, so every
  flow starts with a fresh send; resend is locked 60s after *every* send including the
  automatic one; countdowns come from `expires_in`, never hardcoded; a send's
  `success: false` means rate-limited — show the server `message` and never auto-retry; a
  send's `success: true` says nothing about the account existing, so always advance to the
  code screen (anti-enumeration); after a successful reset every token is revoked, so clear
  the token and route to login, never auto-login.
- **Arabic-Indic digits:** never strip with an ASCII-only `\d`/`[^0-9]` before normalizing —
  it silently deletes an Arabic code. Normalize through `normalizeDigits`
  (`src/utils/digits.ts`) first.
- **Quiz invariants:** `Question.type` is one of six values — branch on `type` via the
  guards in `src/utils/quizQuestionTypes.ts`, never on `answers.length`. Scoring is
  **unit-based** (`match` = one per pair, `paragraph` = sum of children); `xp` is
  server-derived. Submit is exactly one entry per **top-level** question via
  `buildSubmitPayload`. Results `userAnswers` is flat — regroup with `groupUserAnswers`, and
  null-guard `answer_1` for match/paragraph.
- **i18n:** no hardcoded user-facing strings — everything through `t()`, with the key added
  to **both** `src/i18n/locales/en.json` and `ar.json`. The root `/locales` directory is
  stale; editing it is a finding.
- **RTL:** `textAlign: 'left'` and let native RTL flip it — **except `TextInput`**, which
  uses `INPUT_TEXT_ALIGN` from `src/lib/rtl.ts` (and must not also set `textAlign` in its
  style, which would win over the prop).
- **Fonts:** font follows the text's *script*, not the UI language — pass `isArabicText(str)`
  as `forceArabic` for user-supplied text. Never a bare `fontWeight` (it drops the custom
  family on Android — use `typography(style, weight)` / `fontWeight(weight)`). Never a new
  inline Arabic-range regex.
- **Design tokens** from `src/config/` (`colors.ts`, `spacing.ts`, `layout.ts`, `fonts.ts`) —
  no hardcoded colours or spacing.
- **testIDs:** kebab-case `{screen}-{element}` on every new interactive element.
- **Regex on Hermes:** explicit `\uXXXX` ranges, never `\p{L}` — an unsupported property
  escape is a bundle-load parse error. In an assembled character class the hyphen stays last.
- **Validators:** `src/utils/validators.ts` is the single source of truth for name/password/
  mobile policy (registration password = min 8). Never re-inline a copy.
- **TypeScript strict:** no `any` without a comment explaining why. Functional components
  only, `StyleSheet.create()` for styles, no Redux/NativeWind/class components.

## Reference

`CLAUDE.md` is the project's single source of truth for conventions; when it disagrees with
the code, the **code wins** and the drift is itself a `docs-guard` finding.
`mobile-otp-guide.md` is the backend OTP contract. `e2e/PARENT_JOURNEY.md` maps the parent
flow.
