import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import CurriculumSetupScreen from '../../screens/CurriculumSetupScreen';
import { CurriculumOptionsDocument } from '../../generated/graphql';
import { mockGoBack } from '../__mocks__/navigation';

let mockRouteParams: { fromProfile?: boolean } = {};
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const navigationMock = jest.requireActual('../__mocks__/navigation');
  return {
    ...actual,
    useNavigation: navigationMock.useNavigation,
    useRoute: () => ({ params: mockRouteParams }),
  };
});

const mockSave = jest.fn();
const mockCurriculum = {
  specialityId: null as string | null,
  electiveSubjects: [] as { id: string; name: string }[],
  save: mockSave,
};
jest.mock('../../context/CurriculumContext', () => ({ useCurriculum: () => mockCurriculum }));

// A student on grade 9, Languages system (stored as a number by an older build).
const mockUser = { id: '1', grade_id: '9', educational_system_id: 2 };
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: () => ({ user: mockUser }),
}));

const subject = (id: string, name: string) => ({
  __typename: 'ElectiveSubject',
  id,
  name,
  educational_system_ids: ['1', '2'],
});
const grade = (overrides = {}) => ({
  __typename: 'GradeCurriculum',
  id: '9',
  name: 'Baccalaureate 2',
  has_specialities: true,
  core_electives: [
    {
      __typename: 'ElectiveGroup',
      group: 'first_foreign_language',
      label: 'First Foreign Language',
      subjects: [subject('47', 'English'), subject('48', 'French')],
    },
  ],
  specialities: [
    {
      __typename: 'Speciality',
      id: '3',
      name: 'Business',
      description: null,
      electives: [
        {
          __typename: 'ElectiveGroup',
          group: 'speciality_choice',
          label: 'Speciality Subject',
          subjects: [subject('53', 'Accounting'), subject('54', 'Business Administration')],
        },
      ],
    },
  ],
  ...overrides,
});
const options = (gradeEntry = grade()) => [
  {
    request: { query: CurriculumOptionsDocument },
    result: { data: { curriculumOptions: [gradeEntry] } },
  },
];

const pressSave = () =>
  act(async () => {
    fireEvent.press(screen.getByTestId('curriculum-save-button'));
  });

describe('CurriculumSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
    mockCurriculum.specialityId = null;
    mockCurriculum.electiveSubjects = [];
    mockSave.mockResolvedValue(undefined);
  });

  it('pre-fills the student’s picks and saves the track with the full list', async () => {
    mockCurriculum.specialityId = '3';
    mockCurriculum.electiveSubjects = [
      { id: '53', name: 'Accounting' },
      { id: '47', name: 'English' },
    ];
    renderWithProviders(<CurriculumSetupScreen />, { apolloMocks: options() });
    await screen.findByTestId('curriculum-save-button');

    await pressSave();

    expect(mockSave).toHaveBeenCalledWith({
      speciality_id: '3',
      elective_subject_ids: ['47', '53'],
    });
    // Gate mode: the navigator swaps the screen out; nothing navigates.
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('refuses an incomplete answer on screen without asking the server', async () => {
    renderWithProviders(<CurriculumSetupScreen />, { apolloMocks: options() });
    await screen.findByTestId('curriculum-save-button');

    await pressSave();

    expect(mockSave).not.toHaveBeenCalled();
    expect(screen.getByTestId('curriculum-track-error')).toBeTruthy();
  });

  it('shows the server’s validation message when it refuses the picks', async () => {
    mockSave.mockRejectedValue({
      errors: [
        {
          message: 'Validation failed for the field [updateProfile].',
          path: ['updateProfile'],
          extensions: {
            validation: {
              elective_subject_ids: ['The selected subject is not offered in your speciality'],
            },
          },
        },
      ],
    });
    mockCurriculum.specialityId = '3';
    mockCurriculum.electiveSubjects = [
      { id: '47', name: 'English' },
      { id: '53', name: 'Accounting' },
    ];
    renderWithProviders(<CurriculumSetupScreen />, { apolloMocks: options() });
    await screen.findByTestId('curriculum-save-button');

    await pressSave();

    expect(screen.getByTestId('curriculum-server-error')).toHaveTextContent(
      'The selected subject is not offered in your speciality',
    );
  });

  it('goes back after saving when opened from Profile', async () => {
    mockRouteParams = { fromProfile: true };
    mockCurriculum.specialityId = '3';
    mockCurriculum.electiveSubjects = [
      { id: '47', name: 'English' },
      { id: '53', name: 'Accounting' },
    ];
    renderWithProviders(<CurriculumSetupScreen />, { apolloMocks: options() });
    await screen.findByTestId('curriculum-save-button');

    await pressSave();

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('says there is nothing to choose for a grade without choices', async () => {
    renderWithProviders(<CurriculumSetupScreen />, {
      apolloMocks: options(
        grade({ has_specialities: false, core_electives: [], specialities: [] }),
      ),
    });

    expect(await screen.findByText('curriculum.nothing_to_choose')).toBeTruthy();
    expect(screen.queryByTestId('curriculum-save-button')).toBeNull();
  });
});
