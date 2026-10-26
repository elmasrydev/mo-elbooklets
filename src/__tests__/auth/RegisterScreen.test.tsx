import React from 'react';
import { fireEvent, screen, act, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../../screens/RegisterScreen';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { apolloClient } from '../../lib/apollo';
import { GraphQLError } from 'graphql';
import type { MockedResponse } from '@apollo/client/testing';
import {
  CurriculumOptionsDocument,
  GetEduSystemsDocument,
  GetGradesDocument,
} from '../../generated/graphql';

// Answer the step-1 availability gate (BKLT-308) with "available" so Next
// isn't blocked.
jest.mock('../../lib/apollo', () => ({
  apolloClient: {
    mutate: jest.fn().mockResolvedValue({
      data: { checkMobileAvailability: { available: true, message: '' } },
    }),
  },
}));

// The screen loads its step-2 reference data through Apollo; step-1 behaviour
// (what these tests cover) does not depend on the result.
const apolloMocks = [
  {
    request: { query: GetGradesDocument },
    result: {
      data: {
        grades: [
          { id: 'grade_1', name: 'Grade 10' },
          { id: 'grade_2', name: 'Grade 11' },
        ],
      },
    },
  },
];

// Mock Modal
const mockShowConfirm = jest.fn();
jest.mock('../../context/ModalContext', () => ({
  useModal: () => ({
    showConfirm: mockShowConfirm,
  }),
  ModalProvider: ({ children }: any) => children,
}));

describe('RegisterScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = async () => {
    renderWithProviders(<RegisterScreen />, { apolloMocks });
    // Wait on what the user sees rather than on a fetch having happened.
    await waitFor(() => expect(screen.getByTestId('register-name-input')).toBeDefined());
  };

  it('renders Step 1 form fields correctly', async () => {
    await renderScreen();

    expect(screen.getByTestId('register-name-input')).toBeDefined();
    expect(screen.getByTestId('register-mobile-input')).toBeDefined();
    expect(screen.getByTestId('register-password-input')).toBeDefined();
    expect(screen.getByTestId('register-confirm-input')).toBeDefined();
    expect(screen.getByTestId('register-submit-button')).toBeDefined();
  });

  it('rejects empty inputs with confirmation error alert', async () => {
    await renderScreen();

    const nextBtn = screen.getByTestId('register-submit-button');
    await act(async () => {
      fireEvent.press(nextBtn);
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'common.error',
        message: 'auth.fill_all_fields',
      }),
    );
  });

  it('transitions from Step 1 to Step 2 upon valid credentials', async () => {
    await renderScreen();

    const nameInput = screen.getByTestId('register-name-input');
    const mobileInput = screen.getByTestId('register-mobile-input');
    const passwordInput = screen.getByTestId('register-password-input');
    const confirmInput = screen.getByTestId('register-confirm-input');
    const nextBtn = screen.getByTestId('register-submit-button');

    fireEvent.changeText(nameInput, 'Ahmed Ali');
    fireEvent.changeText(mobileInput, '01007867184');
    fireEvent.changeText(passwordInput, 'DemoPass1!');
    fireEvent.changeText(confirmInput, 'DemoPass1!');

    await act(async () => {
      fireEvent.press(nextBtn);
    });

    // Verify Step 2 is rendered by asserting select grade title/text
    expect(screen.getByText('auth.select_grade_title')).toBeDefined();
    expect(screen.getByText('auth.select_edu_system')).toBeDefined();
  });

  it('blocks final step registration if grade is not selected', async () => {
    await renderScreen();

    // Fill Step 1
    fireEvent.changeText(screen.getByTestId('register-name-input'), 'Ahmed Ali');
    fireEvent.changeText(screen.getByTestId('register-mobile-input'), '01007867184');
    fireEvent.changeText(screen.getByTestId('register-password-input'), 'DemoPass1!');
    fireEvent.changeText(screen.getByTestId('register-confirm-input'), 'DemoPass1!');

    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit-button'));
    });

    // Press Sign Up (Step 2 submit) without selecting a grade
    mockShowConfirm.mockClear();
    await act(async () => {
      fireEvent.press(screen.getByTestId('register-submit-button'));
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'common.error',
        message: 'auth.fill_all_fields',
      }),
    );
  });

  // Step 2 with the Baccalaureate options PRS serves (2026-10-26, trimmed).
  describe('Baccalaureate track + electives (step 2)', () => {
    const subject = (id: string, name: string) => ({
      __typename: 'ElectiveSubject',
      id,
      name,
      educational_system_ids: ['sys_1', 'sys_2'],
    });
    const options = [
      {
        __typename: 'GradeCurriculum',
        id: 'grade_1',
        name: 'Grade 10',
        has_specialities: false,
        core_electives: [],
        specialities: [],
      },
      {
        __typename: 'GradeCurriculum',
        id: 'grade_2',
        name: 'Grade 11',
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
      },
    ];
    const systemsMock = {
      request: { query: GetEduSystemsDocument },
      result: { data: { educationalSystems: [{ id: 'sys_2', name: 'Languages' }] } },
    };
    const optionsMock: MockedResponse = {
      request: { query: CurriculumOptionsDocument },
      result: { data: { curriculumOptions: options } },
      maxUsageCount: Number.POSITIVE_INFINITY,
    };
    const rejectedOptionsMock: MockedResponse = {
      request: { query: CurriculumOptionsDocument },
      result: {
        errors: [new GraphQLError('Cannot query field "curriculumOptions" on type "Query".')],
      },
      maxUsageCount: Number.POSITIVE_INFINITY,
    };

    const registerInput = () => {
      const call = (apolloClient.mutate as jest.Mock).mock.calls.find(
        ([args]) => args.variables?.input?.grade_id,
      );
      return call?.[0].variables.input;
    };

    const renderStepTwo = async (gradeId: string, curriculumMock: MockedResponse = optionsMock) => {
      renderWithProviders(<RegisterScreen />, {
        apolloMocks: [...apolloMocks, systemsMock, curriculumMock],
      });
      await waitFor(() => expect(screen.getByTestId('register-name-input')).toBeDefined());
      fireEvent.changeText(screen.getByTestId('register-name-input'), 'Ahmed Ali');
      fireEvent.changeText(screen.getByTestId('register-mobile-input'), '01007867184');
      fireEvent.changeText(screen.getByTestId('register-password-input'), 'DemoPass1!');
      fireEvent.changeText(screen.getByTestId('register-confirm-input'), 'DemoPass1!');
      await act(async () => {
        fireEvent.press(screen.getByTestId('register-submit-button'));
      });
      await waitFor(() => expect(screen.getByTestId(`register-grade-${gradeId}`)).toBeDefined());
      fireEvent.press(screen.getByTestId(`register-grade-${gradeId}`));
      fireEvent.press(screen.getByTestId('register-edu-sys_2'));
      // A promo code skips the no-referral disclaimer modal.
      fireEvent.changeText(screen.getByTestId('register-promo-input'), 'ELB2026');
    };

    const submit = async () => {
      mockShowConfirm.mockClear();
      await act(async () => {
        fireEvent.press(screen.getByTestId('register-submit-button'));
      });
    };

    it('blocks a track grade until track and every group are answered, then sends them', async () => {
      await renderStepTwo('grade_2');
      await waitFor(() => expect(screen.getByTestId('curriculum-picker')).toBeDefined());

      await submit();
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'auth.fill_all_fields' }),
      );
      expect(screen.getByTestId('curriculum-track-error')).toBeDefined();
      expect(registerInput()).toBeUndefined();

      fireEvent.press(screen.getByTestId('curriculum-track-3'));
      fireEvent.press(screen.getByTestId('curriculum-first_foreign_language-47'));
      fireEvent.press(screen.getByTestId('curriculum-speciality_choice-53'));
      await submit();

      await waitFor(() =>
        expect(registerInput()).toEqual(
          expect.objectContaining({
            grade_id: 'grade_2',
            educational_system_id: 'sys_2',
            speciality_id: '3',
            elective_subject_ids: ['47', '53'],
          }),
        ),
      );
    });

    it('shows no picker for a grade without tracks and sends neither field', async () => {
      await renderStepTwo('grade_1');
      expect(screen.queryByTestId('curriculum-picker')).toBeNull();

      await submit();

      await waitFor(() => expect(registerInput()).toBeDefined());
      expect(registerInput()).not.toHaveProperty('speciality_id');
      expect(registerInput()).not.toHaveProperty('elective_subject_ids');
    });

    it('registers as before on a backend without the curriculum fields', async () => {
      await renderStepTwo('grade_2', rejectedOptionsMock);
      expect(screen.queryByTestId('curriculum-picker')).toBeNull();

      await submit();

      await waitFor(() => expect(registerInput()).toBeDefined());
      expect(registerInput()).not.toHaveProperty('speciality_id');
      expect(registerInput()).not.toHaveProperty('elective_subject_ids');
    });
  });
});
