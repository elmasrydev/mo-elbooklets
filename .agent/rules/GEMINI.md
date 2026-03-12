---
trigger: always_on
---

# GEMINI.md - Antigravity Kit

## 🛡️ CORE PROTOCOLS

### 1. Agent & Skill Protocol

- **MANDATORY**: Read the appropriate agent and skills BEFORE implementation.
- **Priority**: P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md).
- **Activation**: Read Rules → Check Frontmatter → Load SKILL.md → Apply All.

### 3. TOON-First Data Representation (Agent-Only)

- **Usage Protocol**: Use **TOON (Token-Oriented Object Notation)** for large data sets, file lists, or structured context transmitted _to_ the agent or handled internally to save tokens.
- **User Readability**: For all responses visible to the USER, ALWAYS use standard human-readable Markdown (lists, tables) or code blocks (JSON/TS) unless the USER explicitly asks for TOON.
- **Goal**: Balance maximum token efficiency with perfect human readability.

---

## 🌐 UNIVERSAL RULES (TIER 0)

### 🧹 Clean Code & Performance

- **Clean Code**: Follow `@[skills/clean-code]`. Concise, direct, no over-engineering.
- **Testing**: Mandatory Unit > Int > E2E using AAA Pattern.
- **Performance**: Adhere to 2025 Core Web Vitals standards and follow `@[skills/performance-rn]`.
- **Safety**: 5-Phase Deployment. Verify secrets security.

### 🌍 Language & Dependencies

- **Internationalization**: Internally translate non-English prompts, respond in user language, keep code/comments in English.
- **Dependency Awareness**: Check `CODEBASE.md` before modifications; update all affected files together.
- **System Map**: Read `ARCHITECTURE.md` at session start.

---

## 🇪🇬 MO-ELBOOKLETS PROJECT RULES

### 🌐 i18n & RTL Logic

- **MANDATORY**: Every UI change or new text MUST be translated into both **Arabic (`ar`)** and **English (`en`)**.
- **Location**: Update [ar.json](file:///Users/ebrahim3bmo3ty/Documents/ReactNative/mo-elbooklets/src/i18n/locales/ar.json) and [en.json](file:///Users/ebrahim3bmo3ty/Documents/ReactNative/mo-elbooklets/src/i18n/locales/en.json) immediately.
- **Automatic Extraction**: Whenever static text is added or modified in components natively, you MUST extract and add it automatically to `src/i18n/locales/ar.json` and `src/i18n/locales/en.json` during the same command/task.
- **Usage Protocol**: Always use the translation keys in the UI (e.g., via `t('key')`). NEVER hardcode strings in components.
- **Native Alignment**: Use `textAlign: 'left'` and `flexDirection: 'row'`. Native RTL flips these automatically.

### 🏗️ Architecture & UI

- **Header**: ALWAYS use [`UnifiedHeader.tsx`](file:///Users/ebrahim3bmo3ty/Documents/ReactNative/mo-elbooklets/src/components/UnifiedHeader.tsx).
- **Navigation**: Stick strictly to the established navigation system.
- **Theming**: Use colors from [`ThemeContext.tsx`](file:///Users/ebrahim3bmo3ty/Documents/ReactNative/mo-elbooklets/src/context/ThemeContext.tsx) and [`colors.ts`](file:///Users/ebrahim3bmo3ty/Documents/ReactNative/mo-elbooklets/src/config/colors.ts).
- **Layout**: Use `screenPadding` from [`layout.ts`](file:///Users/ebrahim3bmo3ty/Documents/ReactNative/mo-elbooklets/src/config/layout.ts).
- **Spacing**: Use standard gaps from [`spacing.ts`](file:///Users/ebrahim3bmo3ty/Documents/ReactNative/mo-elbooklets/src/config/spacing.ts).

### 🚫 Anti-Alert Policy

- **Native Alerts**: NEVER use `Alert.alert` or `Alert.prompt` from `react-native`.
- **Custom Popup**: ALWAYS use the custom modal system via `showConfirm`.
- **Reference**: [`ConfirmModal.tsx`](file:///Users/ebrahim3bmo3ty/Documents/ReactNative/mo-elbooklets/src/components/ConfirmModal.tsx) and [`ModalContext.tsx`](file:///Users/ebrahim3bmo3ty/Documents/ReactNative/mo-elbooklets/src/context/ModalContext.tsx).

---

## 🛠️ DEVELOPMENT PROTOCOLS (TIER 1)

### 📱 Project Routing

- **Mobile**: Use `mobile-developer` + `mobile-design`.
- **Web**: Use `frontend-specialist` + `frontend-design`.
- **Backend**: Use `backend-specialist` + `api-patterns`/`database-design`.

### 🛑 Socratic Gate

**MANDATORY**: Pass every request through the Socratic Gate BEFORE tool use.

- **New Features**: ASK min. 3 strategic questions.
- **Bug Fixes**: Confirm understanding + ask impact questions.
- **Validation**: Even if answers are given, ask 2 "Edge Case" questions.

### 🏁 Final Checklist Protocol

Trigger on "final checks" or "checklist". A task is NOT finished until `checklist.py` returns success.

| Script                | Purpose                     |
| :-------------------- | :-------------------------- |
| `security_scan.py`    | Vulnerabilities & secrets   |
| `lint_runner.py`      | Linting & types             |
| `test_runner.py`      | Unit/Integration tests      |
| `ux_audit.py`         | UI/UX & Accessibility       |
| `mobile_audit.py`     | Mobile platform conventions |
| `lighthouse_audit.py` | Performance/Web Vitals      |

---

## 🔊 PREFERENCES

- **Completion Sound**: Always run `bash .agent/scripts/play_completion_sound.sh` before `notify_user`..
