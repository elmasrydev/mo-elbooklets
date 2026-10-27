import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { GraphQLError } from 'graphql';
import { gql, InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import { CurriculumProvider, useCurriculum } from '../../context/CurriculumContext';
import { MyCurriculumDocument, SaveCurriculumDocument } from '../../generated/graphql';

// The provider reads only the account and role from AuthContext.
const mockAuth = { user: { id: '1', grade_id: '9' } as any, userRole: 'student' as string | null };
jest.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));

const BUSINESS = { __typename: 'Speciality', id: '3', name: 'Business' };
const PICKS = [
  { __typename: 'Subject', id: '47', name: 'English' },
  { __typename: 'Subject', id: '53', name: 'Accounting' },
];
// `needsCurriculum` is the ROOT profileCompleteness (the nested one crashes on PRS).
const myCurriculum = (needsCurriculum: boolean, saved = false) => ({
  request: { query: MyCurriculumDocument },
  result: {
    data: {
      me: {
        __typename: 'User',
        id: '1',
        speciality_id: saved ? '3' : null,
        speciality: saved ? BUSINESS : null,
        elective_subjects: saved ? PICKS : [],
      },
      profileCompleteness: { __typename: 'ProfileCompleteness', needsCurriculum },
    },
  },
});

const input = { speciality_id: '3', elective_subject_ids: ['47', '53'] };
const saveCurriculum: MockedResponse = {
  request: { query: SaveCurriculumDocument, variables: { input } },
  result: {
    data: {
      updateProfile: {
        __typename: 'User',
        id: '1',
        speciality_id: '3',
        speciality: BUSINESS,
        elective_subjects: PICKS,
      },
    },
  },
};

// A list the server filters by the picks, as a screen would have cached it.
const SUBJECTS = gql`
  query StudySubjectsProbe {
    subjectsForUserGrade {
      id
    }
  }
`;

const renderCurriculum = (mocks: readonly MockedResponse[], cache = new InMemoryCache()) =>
  renderHook(() => useCurriculum(), {
    wrapper: ({ children }) => (
      <MockedProvider mocks={mocks} cache={cache}>
        <CurriculumProvider>{children}</CurriculumProvider>
      </MockedProvider>
    ),
  });

describe('CurriculumProvider', () => {
  beforeEach(() => {
    mockAuth.user = { id: '1', grade_id: '9' };
    mockAuth.userRole = 'student';
  });

  it('reports what the server wants from the student', async () => {
    const { result } = renderCurriculum([myCurriculum(true)]);
    await waitFor(() => expect(result.current.needsCurriculum).toBe(true));
  });

  it('fails open when the backend rejects the document (demo / production)', async () => {
    const rejected: MockedResponse = {
      request: { query: MyCurriculumDocument },
      result: { errors: [new GraphQLError('Cannot query field "speciality_id" on type "User".')] },
    };
    const { result } = renderCurriculum([rejected]);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.needsCurriculum).toBeNull();
  });

  it('asks nothing for a parent', async () => {
    mockAuth.userRole = 'parent';
    const { result } = renderCurriculum([]);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.needsCurriculum).toBeNull();
  });

  it('save re-reads the gate and drops the pick-filtered lists', async () => {
    const cache = new InMemoryCache();
    cache.writeQuery({
      query: SUBJECTS,
      data: { subjectsForUserGrade: [{ __typename: 'Subject', id: '10' }] },
    });
    const { result } = renderCurriculum(
      [myCurriculum(true), saveCurriculum, myCurriculum(false, true)],
      cache,
    );
    await waitFor(() => expect(result.current.needsCurriculum).toBe(true));

    await act(() => result.current.save(input));

    // save() resolves only once the re-read landed — no waiting needed.
    expect(result.current.needsCurriculum).toBe(false);
    expect(result.current.speciality?.name).toBe('Business');
    expect(result.current.electiveSubjects.map((s) => s.id)).toEqual(['47', '53']);
    expect(cache.readQuery({ query: SUBJECTS })).toBeNull();
  });
});
