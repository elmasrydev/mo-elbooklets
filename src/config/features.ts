/**
 * Build-time feature switches for finished work that is not being launched yet.
 *
 * These are NOT debug flags — they do not read `app.json > extra.debugMode` and
 * they behave identically in every environment. Flip the constant, rebuild, and
 * the feature is on. Anything that varies per environment belongs in
 * `debug.ts` / `api.ts` instead.
 */

/**
 * Study plan / weekly calendar (Home's "Today's Plan" card + the StudyCalendar
 * screen). **Off — not launching for now.**
 *
 * Important for whoever revisits this: the mobile implementation is **complete,
 * not a stub**. `StudyCalendarScreen` can add a subject to a day, remove one,
 * pick the subject, set lesson/quiz goals and persist the whole week through the
 * `SaveStudySchedule` mutation. It is not a read-only mirror of a plan built on
 * the web. Nothing was deleted when it was hidden, so turning this back to
 * `true` restores the feature as it was — no re-implementation needed.
 *
 * Turning it on re-enables three things (see CLAUDE.md):
 *   1. Home's "Today's Plan" card and its `TodaySchedule` query
 *   2. The `StudyCalendar` route in TabNavigator
 *   3. Any navigation to `StudyCalendar`
 */
export const STUDY_PLAN_ENABLED = false;
