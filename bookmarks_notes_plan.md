# Implementation Plan: Lesson Bookmarks and Notes

This plan details the steps to implement bookmarking and note-taking for lesson key points as per the user requirements.

## 1. Schema and API Layer (COMPLETED ✅)
- **Create `src/graphql/lesson.graphql`**: Defined mutations and queries for bookmarks and notes.
- **Update `src/graphql/schema.graphql`**: Added new types and operations.
- **Run Codegen**: Generated TypeScript hooks for the new operations.

## 2. UI Enhancements in `StudyLessonScreen.tsx`
- **Actions Row**: Add bookmark and note buttons to each `LessonPoint` item.
- **Modals**:
    - Add a `NoteModal` to allow users to type and save notes.
    - Integrate the note input into the bookmarking flow if requested.
- **Visual Feedback**: Show success animations or confirmation modals using `ConfirmModal` or `showConfirm`.

## 3. New Screen: `BookmarksNotesScreen.tsx`
- **Location**: `src/screens/study/BookmarksNotesScreen.tsx`.
- **Features**:
    - List all saved bookmarks and notes.
    - Group by Lesson/Chapter.
    - Swipe-to-delete or management actions.
    - Navigation logic to open the lesson and highlight the specific point.

## 4. Navigation and Integration
- **Side Menu**: Add "Bookmarks & Notes" to `src/components/navigation/Sidebar.tsx` (need to find the exact file).
- **Navigation Params**: Support `targetPointId` in `StudyLessonScreen` to auto-scroll and highlight.

## 5. Files to be Modified/Created
- `src/graphql/lesson.graphql` (New)
- `src/graphql/schema.graphql` (Update)
- `src/screens/study/StudyLessonScreen.tsx` (Update)
- `src/screens/study/BookmarksNotesScreen.tsx` (New)
- `src/components/navigation/Sidebar.tsx` (Update - placeholder name)
- `src/i18n/locales/en.json` & `ar.json` (Update)

## 6. Development Workflow
1. **Define GraphQL operations**.
2. **Implement bookmark/note UI** in `StudyLessonScreen`.
3. **Create the Bookmarks management screen**.
4. **Integrate into navigation**.
5. **Add localization keys**.
6. **Final audit and testing**.
