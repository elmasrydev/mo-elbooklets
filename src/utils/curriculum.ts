/**
 * Baccalaureate tracks & electives — the pure rules behind the picker
 * (contract: `mobile-baccalaureate-tracks-and-electives.md` §2–§5).
 *
 * Which grades have tracks, the track names, the groups and the subjects all
 * come from `curriculumOptions`; nothing here knows a single id. The server
 * owns validation — these helpers only decide what to show, what to clear
 * when a pick above changes, and what to send.
 *
 * Group keys and `educational_system_ids` are GraphQL `ID`s, compared as
 * strings throughout. A core group key (e.g. `first_foreign_language`) is
 * assumed never to collide with a track group key (`speciality_choice`) —
 * that is how `selectSpeciality` tells a core pick from a track pick.
 */
import type { CurriculumOptionsQuery } from '../generated/graphql';

export type GradeCurriculum = CurriculumOptionsQuery['curriculumOptions'][number];
export type ElectiveGroup = GradeCurriculum['core_electives'][number];
export type ElectiveSubject = ElectiveGroup['subjects'][number];

/** The student's answers: the track, and one subject id per group key. */
export interface CurriculumSelection {
  specialityId: string | null;
  electiveByGroup: Record<string, string>;
}

export const EMPTY_SELECTION: CurriculumSelection = { specialityId: null, electiveByGroup: {} };

/** The entry for a grade id, however the id was stored (`user.grade_id` may be a number in old sessions). */
export const findGrade = (
  options: readonly GradeCurriculum[] | undefined,
  gradeId: string | number | null | undefined,
): GradeCurriculum | undefined =>
  gradeId == null ? undefined : options?.find((grade) => grade.id === String(gradeId));

/**
 * A track subject exists once per educational system (رياضيات vs Mathematics);
 * the student must only be offered their own system's copy, and a group with
 * nothing left to offer is hidden (contract §2). No system yet ⇒ no filter.
 */
const groupsForSystem = (
  groups: readonly ElectiveGroup[],
  systemId: string | null,
): ElectiveGroup[] =>
  groups
    .map((group) => ({
      ...group,
      subjects: group.subjects.filter(
        (subject) => systemId === null || subject.educational_system_ids.includes(systemId),
      ),
    }))
    .filter((group) => group.subjects.length > 0);

/** Core groups + the chosen track's groups, after the system filter — one picker each. */
export const visibleGroups = (
  grade: GradeCurriculum,
  systemId: string | null,
  specialityId: string | null,
): ElectiveGroup[] => {
  const track = grade.specialities.find((speciality) => speciality.id === specialityId);
  return [
    ...groupsForSystem(grade.core_electives, systemId),
    ...groupsForSystem(track?.electives ?? [], systemId),
  ];
};

/** Whether this grade asks anything beyond "which grade" — if not, render nothing extra. */
export const gradeHasChoices = (grade: GradeCurriculum, systemId: string | null): boolean =>
  grade.has_specialities || visibleGroups(grade, systemId, null).length > 0;

/** Changing track keeps the core picks (the language) and drops the old track's (contract §3). */
export const selectSpeciality = (
  selection: CurriculumSelection,
  grade: GradeCurriculum,
  specialityId: string,
): CurriculumSelection => {
  // ChoiceChips fires for the active chip too; a re-tap is not a change.
  if (specialityId === selection.specialityId) return selection;
  const core = new Set(grade.core_electives.map((group) => group.group));
  const electiveByGroup = Object.fromEntries(
    Object.entries(selection.electiveByGroup).filter(([group]) => core.has(group)),
  );
  return { specialityId, electiveByGroup };
};

export const selectElective = (
  selection: CurriculumSelection,
  group: string,
  subjectId: string,
): CurriculumSelection => ({
  ...selection,
  electiveByGroup: { ...selection.electiveByGroup, [group]: subjectId },
});

/** After a system change: drop every pick the new system no longer offers (contract §3). */
export const pruneSelection = (
  selection: CurriculumSelection,
  grade: GradeCurriculum,
  systemId: string | null,
): CurriculumSelection => {
  const specialityId = grade.specialities.some((s) => s.id === selection.specialityId)
    ? selection.specialityId
    : null;
  const electiveByGroup: Record<string, string> = {};
  for (const group of visibleGroups(grade, systemId, specialityId)) {
    const picked = selection.electiveByGroup[group.group];
    if (picked && group.subjects.some((subject) => subject.id === picked)) {
      electiveByGroup[group.group] = picked;
    }
  }
  return { specialityId, electiveByGroup };
};

export interface MissingPicks {
  speciality: boolean;
  /** Group keys still unanswered, in display order. */
  groups: string[];
}

/** What still blocks a submit — drives the inline messages, one per section. */
export const missingPicks = (
  grade: GradeCurriculum,
  systemId: string | null,
  selection: CurriculumSelection,
): MissingPicks => ({
  speciality: grade.has_specialities && !selection.specialityId,
  groups: visibleGroups(grade, systemId, selection.specialityId)
    .filter((group) => !selection.electiveByGroup[group.group])
    .map((group) => group.group),
});

export const isSelectionComplete = (missing: MissingPicks): boolean =>
  !missing.speciality && missing.groups.length === 0;

/** The two optional `RegisterInput` / `UpdateProfileInput` fields. */
export interface CurriculumInput {
  speciality_id?: string;
  elective_subject_ids?: string[];
}

/**
 * Contract §3 submit table: `speciality_id` only for a grade with tracks (the
 * server rejects one otherwise), `elective_subject_ids` only when groups were
 * shown — a flat list, one id per group. Both keys are omitted, not nulled,
 * so a backend without the fields (demo/prod) never sees them.
 */
export const toCurriculumInput = (
  grade: GradeCurriculum,
  systemId: string | null,
  selection: CurriculumSelection,
): CurriculumInput => {
  const input: CurriculumInput = {};
  if (grade.has_specialities && selection.specialityId)
    input.speciality_id = selection.specialityId;
  const groups = visibleGroups(grade, systemId, selection.specialityId);
  if (groups.length > 0) {
    input.elective_subject_ids = groups
      .map((group) => selection.electiveByGroup[group.group])
      .filter((id): id is string => !!id);
  }
  return input;
};

/** Pre-fill from `me`: match `elective_subjects[].id` against each group's subjects (contract §5). */
export const fromServer = (
  grade: GradeCurriculum,
  systemId: string | null,
  specialityId: string | null | undefined,
  electiveSubjectIds: readonly string[],
): CurriculumSelection => {
  const known = grade.specialities.some((s) => s.id === specialityId)
    ? (specialityId ?? null)
    : null;
  const electiveByGroup: Record<string, string> = {};
  for (const group of visibleGroups(grade, systemId, known)) {
    const hit = group.subjects.find((subject) => electiveSubjectIds.includes(subject.id));
    if (hit) electiveByGroup[group.group] = hit.id;
  }
  return { specialityId: known, electiveByGroup };
};
