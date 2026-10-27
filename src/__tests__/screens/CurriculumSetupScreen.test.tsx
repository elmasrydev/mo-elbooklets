import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { GraphQLError } from 'graphql';
import type { MockedResponse } from '@apollo/client/testing';
import { renderWithProviders } from '../helpers/renderWithProviders';
import CurriculumSetupScreen from '../../screens/CurriculumSetupScreen';
import { CurriculumProvider, useCurriculum } from '../../context/CurriculumContext';
import {
  CurriculumOptionsDocument,
  MyCurriculumDocument,
  SaveCurriculumDocument,
} from '../../generated/graphql';
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

// A signed-in grade-9 student on the Languages system, stored as a number by
// an older build. The real CurriculumProvider reads only these from auth.
const mockUser = { id: '1', grade_id: '9', educational_system_id: 2 };
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: () => ({ user: mockUser, userRole: 'student' }),
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
const optionsMock = (gradeEntry = grade()): MockedResponse => ({
  request: { query: CurriculumOptionsDocument },
  result: { data: { curriculumOptions: [gradeEntry] } },
});

const student = (saved: boolean) => ({
  __typename: 'User',
  id: '1',
  speciality_id: saved ? '3' : null,
  speciality: saved ? { __typename: 'Speciality', id: '3', name: 'Business' } : null,
  elective_subjects: saved
    ? [
        { __typename: 'Subject', id: '53', name: 'Accounting' },
        { __typename: 'Subject', id: '47', name: 'English' },
      ]
    : [],
});
const myCurriculum = (saved: boolean, needsCurriculum: boolean): MockedResponse => ({
  request: { query: MyCurriculumDocument },
  result: {
    data: {
      me: student(saved),
      profileCompleteness: { __typename: 'ProfileCompleteness', needsCurriculum },
    },
  },
});
// A student the gate holds (owes picks, has none) or one editing saved picks.
// After a save the provider re-reads MyCurriculum, so each save test queues
// the answer it gets back.
const owesPicks = myCurriculum(false, true);
const hasPicks = myCurriculum(true, false);
// Exact variables: a payload without the track, or with a partial list, finds
// no mock and fails the save — the contract's "always send both, in full".
const saveRequest = {
  query: SaveCurriculumDocument,
  variables: { input: { speciality_id: '3', elective_subject_ids: ['47', '53'] } },
};
const saveSucceeds: MockedResponse = {
  request: saveRequest,
  result: { data: { updateProfile: student(true) } },
};

// What AppNavigator reads to decide between the gate and the tabs.
const GateProbe = () => <Text testID="gate-state">{String(useCurriculum().needsCurriculum)}</Text>;

const renderScreen = (mocks: MockedResponse[]) =>
  renderWithProviders(
    <CurriculumProvider>
      <CurriculumSetupScreen />
      <GateProbe />
    </CurriculumProvider>,
    { apolloMocks: mocks },
  );

const isSelected = (testID: string): boolean =>
  screen.getByTestId(testID).props.accessibilityState.selected;

const pressSave = () =>
  act(async () => {
    fireEvent.press(screen.getByTestId('curriculum-save-button'));
  });

describe('CurriculumSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
  });

  it('clears the gate once the track and every group are picked and saved', async () => {
    renderScreen([optionsMock(), owesPicks, saveSucceeds, hasPicks]);
    await waitFor(() => expect(screen.getByTestId('gate-state')).toHaveTextContent('true'));
    await screen.findByTestId('curriculum-track-3');

    fireEvent.press(screen.getByTestId('curriculum-track-3'));
    fireEvent.press(screen.getByTestId('curriculum-first_foreign_language-47'));
    fireEvent.press(screen.getByTestId('curriculum-speciality_choice-53'));
    await pressSave();

    // AppNavigator swaps the gate for the tabs on this flag; nothing navigates.
    await waitFor(() => expect(screen.getByTestId('gate-state')).toHaveTextContent('false'));
    expect(screen.queryByTestId('curriculum-server-error')).toBeNull();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('pre-fills the saved picks in Profile and goes back after saving them', async () => {
    mockRouteParams = { fromProfile: true };
    renderScreen([optionsMock(), hasPicks, saveSucceeds, hasPicks]);
    await waitFor(() => expect(isSelected('curriculum-speciality_choice-53')).toBe(true));
    expect(isSelected('curriculum-first_foreign_language-47')).toBe(true);

    await pressSave();

    await waitFor(() => expect(mockGoBack).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('curriculum-server-error')).toBeNull();
  });

  it('refuses an incomplete answer on screen without asking the server', async () => {
    renderScreen([optionsMock(), owesPicks]);
    await waitFor(() => expect(screen.getByTestId('gate-state')).toHaveTextContent('true'));
    await screen.findByTestId('curriculum-track-3');

    await pressSave();

    expect(screen.getByTestId('curriculum-track-error')).toBeTruthy();
    // No SaveCurriculum mock exists, so a request would have surfaced an error.
    expect(screen.queryByTestId('curriculum-server-error')).toBeNull();
  });

  it('shows the server’s validation message when it refuses the picks', async () => {
    const refused: MockedResponse = {
      request: saveRequest,
      result: {
        errors: [
          new GraphQLError('Validation failed for the field [updateProfile].', {
            path: ['updateProfile'],
            extensions: {
              validation: {
                elective_subject_ids: ['The selected subject is not offered in your speciality'],
              },
            },
          }),
        ],
      },
    };
    renderScreen([optionsMock(), hasPicks, refused]);
    await waitFor(() => expect(isSelected('curriculum-speciality_choice-53')).toBe(true));

    await pressSave();

    expect(await screen.findByTestId('curriculum-server-error')).toHaveTextContent(
      'The selected subject is not offered in your speciality',
    );
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('says there is nothing to choose for a grade without choices', async () => {
    renderScreen([
      optionsMock(grade({ has_specialities: false, core_electives: [], specialities: [] })),
      owesPicks,
    ]);

    expect(await screen.findByText('curriculum.nothing_to_choose')).toBeTruthy();
    expect(screen.queryByTestId('curriculum-save-button')).toBeNull();
  });
});
