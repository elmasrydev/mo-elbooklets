import {
  EMPTY_SELECTION,
  findGrade,
  fromServer,
  gradeHasChoices,
  isSelectionComplete,
  missingPicks,
  pruneSelection,
  selectElective,
  selectSpeciality,
  toCurriculumInput,
  visibleGroups,
  GradeCurriculum,
} from '../../utils/curriculum';

// Shaped like PRS's Baccalaureate 2 (2026-10-26), with system ids narrowed so
// the educational-system filter has something to do: Mathematics exists for
// the Arabic system only, and the Arts track's group only for Arabic.
const subject = (id: string, name: string, systems = ['1', '2']) => ({
  id,
  name,
  educational_system_ids: systems,
});
const bacc: GradeCurriculum = {
  id: '9',
  name: 'Baccalaureate 2',
  has_specialities: true,
  core_electives: [
    {
      group: 'first_foreign_language',
      label: 'First Foreign Language',
      subjects: [subject('47', 'English'), subject('48', 'French')],
    },
  ],
  specialities: [
    {
      id: '1',
      name: 'Medicine',
      description: null,
      electives: [
        {
          group: 'speciality_choice',
          label: 'Speciality Subject',
          subjects: [subject('49', 'Mathematics', ['1']), subject('50', 'Physics')],
        },
      ],
    },
    {
      id: '4',
      name: 'Arts',
      description: null,
      electives: [
        {
          group: 'speciality_choice',
          label: 'Speciality Subject',
          subjects: [subject('55', 'Psychology', ['1']), subject('56', 'Languages', ['1'])],
        },
      ],
    },
  ],
};
const prep: GradeCurriculum = {
  id: '5',
  name: 'Preparatory 2',
  has_specialities: false,
  core_electives: [],
  specialities: [],
};
const options = [prep, bacc];

describe('findGrade', () => {
  it('finds a grade stored as a number by an older build, and nothing without one', () => {
    expect(findGrade(options, 9)).toBe(bacc);
    expect(findGrade(options, null)).toBeUndefined();
    expect(findGrade(undefined, '9')).toBeUndefined();
  });
});

describe('gradeHasChoices', () => {
  it('asks nothing extra of a grade without tracks or elective groups', () => {
    expect(gradeHasChoices(bacc, '2')).toBe(true);
    expect(gradeHasChoices(prep, '2')).toBe(false);
  });
});

describe('visibleGroups (educational-system filter)', () => {
  it('offers only the chosen system’s copies and hides a group left empty', () => {
    const arts = visibleGroups(bacc, '2', '4');
    expect(arts.map((g) => g.group)).toEqual(['first_foreign_language']);
    const medicine = visibleGroups(bacc, '2', '1');
    expect(medicine[1].subjects.map((s) => s.id)).toEqual(['50']);
    expect(visibleGroups(bacc, '1', '1')[1].subjects.map((s) => s.id)).toEqual(['49', '50']);
  });

  it('shows core groups only until a track is picked, and everything with no system', () => {
    expect(visibleGroups(bacc, '2', null).map((g) => g.group)).toEqual(['first_foreign_language']);
    expect(visibleGroups(bacc, null, '4')[1].subjects).toHaveLength(2);
  });
});

describe('reset rules (contract §3)', () => {
  const full = selectElective(
    selectElective(selectSpeciality(EMPTY_SELECTION, bacc, '1'), 'first_foreign_language', '47'),
    'speciality_choice',
    '49',
  );

  it('changing track keeps the language and drops the track subject', () => {
    expect(selectSpeciality(full, bacc, '4')).toEqual({
      specialityId: '4',
      electiveByGroup: { first_foreign_language: '47' },
    });
  });

  it('re-tapping the current track keeps its subject', () => {
    expect(selectSpeciality(full, bacc, '1')).toBe(full);
  });

  it('changing system drops the picks the new system does not offer', () => {
    expect(pruneSelection(full, bacc, '2')).toEqual({
      specialityId: '1',
      electiveByGroup: { first_foreign_language: '47' },
    });
    expect(pruneSelection(full, bacc, '1')).toEqual(full);
  });

  it('drops a track the grade no longer lists, and its picks with it', () => {
    const stale = { ...full, specialityId: '99' };
    expect(pruneSelection(stale, bacc, '1')).toEqual({
      specialityId: null,
      electiveByGroup: { first_foreign_language: '47' },
    });
  });
});

describe('missingPicks / isSelectionComplete', () => {
  it('names the track and each unanswered group, in display order', () => {
    expect(missingPicks(bacc, '1', EMPTY_SELECTION)).toEqual({
      speciality: true,
      groups: ['first_foreign_language'],
    });
    const tracked = selectSpeciality(EMPTY_SELECTION, bacc, '1');
    expect(missingPicks(bacc, '1', tracked).groups).toEqual([
      'first_foreign_language',
      'speciality_choice',
    ]);
    expect(isSelectionComplete(missingPicks(prep, '1', EMPTY_SELECTION))).toBe(true);
  });
});

describe('toCurriculumInput (contract §3 submit table)', () => {
  it('omits both keys for a grade without tracks or groups', () => {
    expect(toCurriculumInput(prep, '1', EMPTY_SELECTION)).toEqual({});
  });

  it('sends the track and one id per visible group, core first', () => {
    const selection = selectElective(
      selectElective(selectSpeciality(EMPTY_SELECTION, bacc, '1'), 'speciality_choice', '50'),
      'first_foreign_language',
      '48',
    );
    expect(toCurriculumInput(bacc, '2', selection)).toEqual({
      speciality_id: '1',
      elective_subject_ids: ['48', '50'],
    });
  });

  it('leaves an unanswered pick to the server rather than inventing one', () => {
    const selection = selectSpeciality(EMPTY_SELECTION, bacc, '1');
    expect(toCurriculumInput(bacc, '2', selection)).toEqual({
      speciality_id: '1',
      elective_subject_ids: [],
    });
  });
});

describe('fromServer (pre-fill, contract §5)', () => {
  it('maps the student’s elective ids back onto their groups', () => {
    expect(fromServer(bacc, '1', '1', ['49', '47'])).toEqual({
      specialityId: '1',
      electiveByGroup: { first_foreign_language: '47', speciality_choice: '49' },
    });
  });

  it('ignores a track or subject the options no longer carry', () => {
    expect(fromServer(bacc, '2', '7', ['49', '47'])).toEqual({
      specialityId: null,
      electiveByGroup: { first_foreign_language: '47' },
    });
  });
});
