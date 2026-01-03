import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: string; output: string; }
  DateTime: { input: string; output: string; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  access_token: Scalars['String']['output'];
  expires_in: Scalars['Int']['output'];
  token_type: Scalars['String']['output'];
  user: User;
};

export type Chapter = {
  __typename?: 'Chapter';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
};

export type Grade = {
  __typename?: 'Grade';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Lesson = {
  __typename?: 'Lesson';
  chapter: Chapter;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  login: AuthPayload;
  register: AuthPayload;
  startQuiz: Quiz;
  submitQuizAnswers: QuizSubmissionResult;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRegisterArgs = {
  email: Scalars['String']['input'];
  grade_id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  password_confirmation: Scalars['String']['input'];
};


export type MutationStartQuizArgs = {
  lessonIds: Array<Scalars['ID']['input']>;
  subjectId: Scalars['ID']['input'];
};


export type MutationSubmitQuizAnswersArgs = {
  answers: Array<QuestionAnswerInput>;
  quizId: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  grades: Array<Grade>;
  lessonsForSubject: Array<Lesson>;
  quiz?: Maybe<Quiz>;
  quizResults?: Maybe<QuizResult>;
  subjectsForUserGrade: Array<Subject>;
  userQuizHistory: Array<UserQuizHistory>;
};


export type QueryLessonsForSubjectArgs = {
  subjectId: Scalars['ID']['input'];
};


export type QueryQuizArgs = {
  id: Scalars['ID']['input'];
};


export type QueryQuizResultsArgs = {
  quizId: Scalars['ID']['input'];
};

export type Question = {
  __typename?: 'Question';
  answer_1: Scalars['String']['output'];
  explanation?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  question: Scalars['String']['output'];
};

export type QuestionAnswerInput = {
  questionId: Scalars['ID']['input'];
  selectedAnswer?: InputMaybe<Scalars['String']['input']>;
};

export type Quiz = {
  __typename?: 'Quiz';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  questions: Array<QuizQuestion>;
};

export type QuizQuestion = {
  __typename?: 'QuizQuestion';
  answers: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  question: Scalars['String']['output'];
  questionNumber: Scalars['Int']['output'];
};

export type QuizResult = {
  __typename?: 'QuizResult';
  answers: Array<UserQuizAnswer>;
  isPassed: Scalars['Boolean']['output'];
  quiz: Quiz;
  score: Scalars['Int']['output'];
  totalQuestions: Scalars['Int']['output'];
};

export type QuizSubmissionResult = {
  __typename?: 'QuizSubmissionResult';
  isPassed: Scalars['Boolean']['output'];
  quiz: Quiz;
  score: Scalars['Int']['output'];
  totalQuestions: Scalars['Int']['output'];
};

export type Subject = {
  __typename?: 'Subject';
  chaptersCount: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  grade: Grade;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type UserQuizAnswer = {
  __typename?: 'UserQuizAnswer';
  isCorrect: Scalars['Boolean']['output'];
  question: Question;
  selectedAnswer: Scalars['String']['output'];
};

export type UserQuizHistory = {
  __typename?: 'UserQuizHistory';
  completedAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isPassed: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  score: Scalars['Int']['output'];
  subject: Subject;
  totalQuestions: Scalars['Int']['output'];
};

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', access_token: string, token_type: string, expires_in: number, user: { __typename?: 'User', id: string, name: string, email: string, grade: { __typename?: 'Grade', id: string, name: string } } } };

export type RegisterMutationVariables = Exact<{
  name: Scalars['String']['input'];
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  password_confirmation: Scalars['String']['input'];
  grade_id: Scalars['ID']['input'];
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AuthPayload', access_token: string, token_type: string, expires_in: number, user: { __typename?: 'User', id: string, name: string, email: string, grade: { __typename?: 'Grade', id: string, name: string } } } };

export type GetGradesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGradesQuery = { __typename?: 'Query', grades: Array<{ __typename?: 'Grade', id: string, name: string }> };

export type UserQuizHistoryQueryVariables = Exact<{ [key: string]: never; }>;


export type UserQuizHistoryQuery = { __typename?: 'Query', userQuizHistory: Array<{ __typename?: 'UserQuizHistory', id: string, name: string, score: number, totalQuestions: number, completedAt: string, isPassed: boolean, subject: { __typename?: 'Subject', id: string, name: string } }> };

export type SubjectsForUserGradeQueryVariables = Exact<{ [key: string]: never; }>;


export type SubjectsForUserGradeQuery = { __typename?: 'Query', subjectsForUserGrade: Array<{ __typename?: 'Subject', id: string, name: string, description?: string | null, chaptersCount: number }> };

export type LessonsForSubjectQueryVariables = Exact<{
  subjectId: Scalars['ID']['input'];
}>;


export type LessonsForSubjectQuery = { __typename?: 'Query', lessonsForSubject: Array<{ __typename?: 'Lesson', id: string, name: string, description?: string | null, chapter: { __typename?: 'Chapter', id: string, name: string, order: number } }> };

export type QuizQueryVariables = Exact<{
  quizId: Scalars['ID']['input'];
}>;


export type QuizQuery = { __typename?: 'Query', quiz?: { __typename?: 'Quiz', id: string, name: string, questions: Array<{ __typename?: 'QuizQuestion', id: string, question: string, answers: Array<string>, questionNumber: number }> } | null };

export type QuizResultsQueryVariables = Exact<{
  quizId: Scalars['ID']['input'];
}>;


export type QuizResultsQuery = { __typename?: 'Query', quizResults?: { __typename?: 'QuizResult', score: number, totalQuestions: number, isPassed: boolean, quiz: { __typename?: 'Quiz', id: string, name: string }, answers: Array<{ __typename?: 'UserQuizAnswer', selectedAnswer: string, isCorrect: boolean, question: { __typename?: 'Question', id: string, question: string, answer_1: string, explanation?: string | null } }> } | null };

export type StartQuizMutationVariables = Exact<{
  subjectId: Scalars['ID']['input'];
  lessonIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type StartQuizMutation = { __typename?: 'Mutation', startQuiz: { __typename?: 'Quiz', id: string, name: string, questions: Array<{ __typename?: 'QuizQuestion', id: string, question: string, answers: Array<string>, questionNumber: number }> } };

export type SubmitQuizAnswersMutationVariables = Exact<{
  quizId: Scalars['ID']['input'];
  answers: Array<QuestionAnswerInput> | QuestionAnswerInput;
}>;


export type SubmitQuizAnswersMutation = { __typename?: 'Mutation', submitQuizAnswers: { __typename?: 'QuizSubmissionResult', score: number, totalQuestions: number, isPassed: boolean, quiz: { __typename?: 'Quiz', id: string, name: string } } };


export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    access_token
    token_type
    expires_in
    user {
      id
      name
      email
      grade {
        id
        name
      }
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const RegisterDocument = gql`
    mutation Register($name: String!, $email: String!, $password: String!, $password_confirmation: String!, $grade_id: ID!) {
  register(
    name: $name
    email: $email
    password: $password
    password_confirmation: $password_confirmation
    grade_id: $grade_id
  ) {
    access_token
    token_type
    expires_in
    user {
      id
      name
      email
      grade {
        id
        name
      }
    }
  }
}
    `;
export type RegisterMutationFn = Apollo.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      name: // value for 'name'
 *      email: // value for 'email'
 *      password: // value for 'password'
 *      password_confirmation: // value for 'password_confirmation'
 *      grade_id: // value for 'grade_id'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: Apollo.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, options);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const GetGradesDocument = gql`
    query GetGrades {
  grades {
    id
    name
  }
}
    `;

/**
 * __useGetGradesQuery__
 *
 * To run a query within a React component, call `useGetGradesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGradesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGradesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetGradesQuery(baseOptions?: Apollo.QueryHookOptions<GetGradesQuery, GetGradesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetGradesQuery, GetGradesQueryVariables>(GetGradesDocument, options);
      }
export function useGetGradesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetGradesQuery, GetGradesQueryVariables>(GetGradesDocument, options);
        }
export function useGetGradesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetGradesQuery, GetGradesQueryVariables>(GetGradesDocument, options);
        }
export type GetGradesQueryHookResult = ReturnType<typeof useGetGradesQuery>;
export type GetGradesLazyQueryHookResult = ReturnType<typeof useGetGradesLazyQuery>;
export type GetGradesSuspenseQueryHookResult = ReturnType<typeof useGetGradesSuspenseQuery>;
export type GetGradesQueryResult = Apollo.QueryResult<GetGradesQuery, GetGradesQueryVariables>;
export const UserQuizHistoryDocument = gql`
    query UserQuizHistory {
  userQuizHistory {
    id
    name
    subject {
      id
      name
    }
    score
    totalQuestions
    completedAt
    isPassed
  }
}
    `;

/**
 * __useUserQuizHistoryQuery__
 *
 * To run a query within a React component, call `useUserQuizHistoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserQuizHistoryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserQuizHistoryQuery({
 *   variables: {
 *   },
 * });
 */
export function useUserQuizHistoryQuery(baseOptions?: Apollo.QueryHookOptions<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>(UserQuizHistoryDocument, options);
      }
export function useUserQuizHistoryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>(UserQuizHistoryDocument, options);
        }
export function useUserQuizHistorySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>(UserQuizHistoryDocument, options);
        }
export type UserQuizHistoryQueryHookResult = ReturnType<typeof useUserQuizHistoryQuery>;
export type UserQuizHistoryLazyQueryHookResult = ReturnType<typeof useUserQuizHistoryLazyQuery>;
export type UserQuizHistorySuspenseQueryHookResult = ReturnType<typeof useUserQuizHistorySuspenseQuery>;
export type UserQuizHistoryQueryResult = Apollo.QueryResult<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>;
export const SubjectsForUserGradeDocument = gql`
    query SubjectsForUserGrade {
  subjectsForUserGrade {
    id
    name
    description
    chaptersCount
  }
}
    `;

/**
 * __useSubjectsForUserGradeQuery__
 *
 * To run a query within a React component, call `useSubjectsForUserGradeQuery` and pass it any options that fit your needs.
 * When your component renders, `useSubjectsForUserGradeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSubjectsForUserGradeQuery({
 *   variables: {
 *   },
 * });
 */
export function useSubjectsForUserGradeQuery(baseOptions?: Apollo.QueryHookOptions<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>(SubjectsForUserGradeDocument, options);
      }
export function useSubjectsForUserGradeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>(SubjectsForUserGradeDocument, options);
        }
export function useSubjectsForUserGradeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>(SubjectsForUserGradeDocument, options);
        }
export type SubjectsForUserGradeQueryHookResult = ReturnType<typeof useSubjectsForUserGradeQuery>;
export type SubjectsForUserGradeLazyQueryHookResult = ReturnType<typeof useSubjectsForUserGradeLazyQuery>;
export type SubjectsForUserGradeSuspenseQueryHookResult = ReturnType<typeof useSubjectsForUserGradeSuspenseQuery>;
export type SubjectsForUserGradeQueryResult = Apollo.QueryResult<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>;
export const LessonsForSubjectDocument = gql`
    query LessonsForSubject($subjectId: ID!) {
  lessonsForSubject(subjectId: $subjectId) {
    id
    name
    description
    chapter {
      id
      name
      order
    }
  }
}
    `;

/**
 * __useLessonsForSubjectQuery__
 *
 * To run a query within a React component, call `useLessonsForSubjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useLessonsForSubjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLessonsForSubjectQuery({
 *   variables: {
 *      subjectId: // value for 'subjectId'
 *   },
 * });
 */
export function useLessonsForSubjectQuery(baseOptions: Apollo.QueryHookOptions<LessonsForSubjectQuery, LessonsForSubjectQueryVariables> & ({ variables: LessonsForSubjectQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>(LessonsForSubjectDocument, options);
      }
export function useLessonsForSubjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>(LessonsForSubjectDocument, options);
        }
export function useLessonsForSubjectSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>(LessonsForSubjectDocument, options);
        }
export type LessonsForSubjectQueryHookResult = ReturnType<typeof useLessonsForSubjectQuery>;
export type LessonsForSubjectLazyQueryHookResult = ReturnType<typeof useLessonsForSubjectLazyQuery>;
export type LessonsForSubjectSuspenseQueryHookResult = ReturnType<typeof useLessonsForSubjectSuspenseQuery>;
export type LessonsForSubjectQueryResult = Apollo.QueryResult<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>;
export const QuizDocument = gql`
    query Quiz($quizId: ID!) {
  quiz(id: $quizId) {
    id
    name
    questions {
      id
      question
      answers
      questionNumber
    }
  }
}
    `;

/**
 * __useQuizQuery__
 *
 * To run a query within a React component, call `useQuizQuery` and pass it any options that fit your needs.
 * When your component renders, `useQuizQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQuizQuery({
 *   variables: {
 *      quizId: // value for 'quizId'
 *   },
 * });
 */
export function useQuizQuery(baseOptions: Apollo.QueryHookOptions<QuizQuery, QuizQueryVariables> & ({ variables: QuizQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<QuizQuery, QuizQueryVariables>(QuizDocument, options);
      }
export function useQuizLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<QuizQuery, QuizQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<QuizQuery, QuizQueryVariables>(QuizDocument, options);
        }
export function useQuizSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuizQuery, QuizQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<QuizQuery, QuizQueryVariables>(QuizDocument, options);
        }
export type QuizQueryHookResult = ReturnType<typeof useQuizQuery>;
export type QuizLazyQueryHookResult = ReturnType<typeof useQuizLazyQuery>;
export type QuizSuspenseQueryHookResult = ReturnType<typeof useQuizSuspenseQuery>;
export type QuizQueryResult = Apollo.QueryResult<QuizQuery, QuizQueryVariables>;
export const QuizResultsDocument = gql`
    query QuizResults($quizId: ID!) {
  quizResults(quizId: $quizId) {
    quiz {
      id
      name
    }
    score
    totalQuestions
    isPassed
    answers {
      question {
        id
        question
        answer_1
        explanation
      }
      selectedAnswer
      isCorrect
    }
  }
}
    `;

/**
 * __useQuizResultsQuery__
 *
 * To run a query within a React component, call `useQuizResultsQuery` and pass it any options that fit your needs.
 * When your component renders, `useQuizResultsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useQuizResultsQuery({
 *   variables: {
 *      quizId: // value for 'quizId'
 *   },
 * });
 */
export function useQuizResultsQuery(baseOptions: Apollo.QueryHookOptions<QuizResultsQuery, QuizResultsQueryVariables> & ({ variables: QuizResultsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<QuizResultsQuery, QuizResultsQueryVariables>(QuizResultsDocument, options);
      }
export function useQuizResultsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<QuizResultsQuery, QuizResultsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<QuizResultsQuery, QuizResultsQueryVariables>(QuizResultsDocument, options);
        }
export function useQuizResultsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<QuizResultsQuery, QuizResultsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<QuizResultsQuery, QuizResultsQueryVariables>(QuizResultsDocument, options);
        }
export type QuizResultsQueryHookResult = ReturnType<typeof useQuizResultsQuery>;
export type QuizResultsLazyQueryHookResult = ReturnType<typeof useQuizResultsLazyQuery>;
export type QuizResultsSuspenseQueryHookResult = ReturnType<typeof useQuizResultsSuspenseQuery>;
export type QuizResultsQueryResult = Apollo.QueryResult<QuizResultsQuery, QuizResultsQueryVariables>;
export const StartQuizDocument = gql`
    mutation StartQuiz($subjectId: ID!, $lessonIds: [ID!]!) {
  startQuiz(subjectId: $subjectId, lessonIds: $lessonIds) {
    id
    name
    questions {
      id
      question
      answers
      questionNumber
    }
  }
}
    `;
export type StartQuizMutationFn = Apollo.MutationFunction<StartQuizMutation, StartQuizMutationVariables>;

/**
 * __useStartQuizMutation__
 *
 * To run a mutation, you first call `useStartQuizMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStartQuizMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [startQuizMutation, { data, loading, error }] = useStartQuizMutation({
 *   variables: {
 *      subjectId: // value for 'subjectId'
 *      lessonIds: // value for 'lessonIds'
 *   },
 * });
 */
export function useStartQuizMutation(baseOptions?: Apollo.MutationHookOptions<StartQuizMutation, StartQuizMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<StartQuizMutation, StartQuizMutationVariables>(StartQuizDocument, options);
      }
export type StartQuizMutationHookResult = ReturnType<typeof useStartQuizMutation>;
export type StartQuizMutationResult = Apollo.MutationResult<StartQuizMutation>;
export type StartQuizMutationOptions = Apollo.BaseMutationOptions<StartQuizMutation, StartQuizMutationVariables>;
export const SubmitQuizAnswersDocument = gql`
    mutation SubmitQuizAnswers($quizId: ID!, $answers: [QuestionAnswerInput!]!) {
  submitQuizAnswers(quizId: $quizId, answers: $answers) {
    quiz {
      id
      name
    }
    score
    totalQuestions
    isPassed
  }
}
    `;
export type SubmitQuizAnswersMutationFn = Apollo.MutationFunction<SubmitQuizAnswersMutation, SubmitQuizAnswersMutationVariables>;

/**
 * __useSubmitQuizAnswersMutation__
 *
 * To run a mutation, you first call `useSubmitQuizAnswersMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitQuizAnswersMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitQuizAnswersMutation, { data, loading, error }] = useSubmitQuizAnswersMutation({
 *   variables: {
 *      quizId: // value for 'quizId'
 *      answers: // value for 'answers'
 *   },
 * });
 */
export function useSubmitQuizAnswersMutation(baseOptions?: Apollo.MutationHookOptions<SubmitQuizAnswersMutation, SubmitQuizAnswersMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SubmitQuizAnswersMutation, SubmitQuizAnswersMutationVariables>(SubmitQuizAnswersDocument, options);
      }
export type SubmitQuizAnswersMutationHookResult = ReturnType<typeof useSubmitQuizAnswersMutation>;
export type SubmitQuizAnswersMutationResult = Apollo.MutationResult<SubmitQuizAnswersMutation>;
export type SubmitQuizAnswersMutationOptions = Apollo.BaseMutationOptions<SubmitQuizAnswersMutation, SubmitQuizAnswersMutationVariables>;