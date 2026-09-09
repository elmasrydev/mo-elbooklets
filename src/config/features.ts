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

/**
 * Quiz-length picker — the "Question Count" card on `QuizSettingsScreen`, whose
 * pills carry each `quizTypes` entry and its `question_count` (10 / 30 / 50 on
 * every environment today). **Off — hidden by product decision (BKLT-397).**
 *
 * While it is off the student never picks a length: the screen keeps
 * auto-selecting the server's `is_default` quiz type, so `startQuiz` still gets
 * a `quizTypeId` and the min-types / shortfall validation still measures the
 * selection against that type's `question_count`. Nothing about the request
 * changes — only the card is gone.
 *
 * Nothing was deleted when it was hidden. The card's JSX, `sortedQuizTypes`,
 * the `pill*` styles and the `quiz_flow.question_count*` / `quiz_flow.default`
 * locale keys all stay, so flipping this to `true` restores the picker as it
 * was. It does **not** gate the count on the generating screen ("Generating 10
 * questions…") or the "Question 01 of 10" progress line — those are separate
 * surfaces the ticket did not ask about.
 */
export const QUIZ_LENGTH_PICKER_ENABLED = false;
