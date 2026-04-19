import { gql } from '@apollo/client';
import * as ApolloReactCommon from '../graphql/apollo-merged';
import * as ApolloReactHooks from '../graphql/apollo-merged';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Date: { input: string; output: string };
  DateTime: { input: string; output: string };
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  access_token: Scalars['String']['output'];
  expires_in: Scalars['Int']['output'];
  token_type: Scalars['String']['output'];
  user: User;
};

export type Badge = {
  __typename?: 'Badge';
  awardedAt?: Maybe<Scalars['DateTime']['output']>;
  category: BadgeCategory;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  rules: Array<BadgeRule>;
  rulesPreview?: Maybe<Scalars['String']['output']>;
};

export type BadgeCategory = {
  __typename?: 'BadgeCategory';
  badgeCount?: Maybe<Scalars['Int']['output']>;
  color?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type BadgeRule = {
  __typename?: 'BadgeRule';
  conditionType: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  operator: Scalars['String']['output'];
  scoreThreshold?: Maybe<Scalars['Float']['output']>;
  subject?: Maybe<Subject>;
  timeframe?: Maybe<Scalars['String']['output']>;
  value: Scalars['String']['output'];
  valueEnd?: Maybe<Scalars['String']['output']>;
};

export type Chapter = {
  __typename?: 'Chapter';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
};

export type DailySchedule = {
  __typename?: 'DailySchedule';
  date: Scalars['String']['output'];
  dayName: Scalars['String']['output'];
  dayOfWeek: Scalars['Int']['output'];
  schedule: Array<StudySchedule>;
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
  lessonPoints?: Maybe<Array<LessonPoint>>;
  name: Scalars['String']['output'];
  points?: Maybe<Array<Scalars['String']['output']>>;
  summary?: Maybe<Scalars['String']['output']>;
};

export type LessonPoint = {
  __typename?: 'LessonPoint';
  explanation?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  order: Scalars['Int']['output'];
  title: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  deleteAccount: SocialActionResponse;
  forgotPassword: SocialActionResponse;
  login: AuthPayload;
  publishQuizToFeed: SocialActionResponse;
  register: AuthPayload;
  saveStudySchedule: Array<StudySchedule>;
  startQuiz: Quiz;
  submitQuizAnswers: QuizSubmissionResult;
};

export type MutationForgotPasswordArgs = {
  email: Scalars['String']['input'];
};

export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MutationPublishQuizToFeedArgs = {
  quizId: Scalars['ID']['input'];
};

export type MutationRegisterArgs = {
  email: Scalars['String']['input'];
  grade_id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  password_confirmation: Scalars['String']['input'];
};

export type MutationSaveStudyScheduleArgs = {
  entries: Array<StudyScheduleInput>;
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
  allBadges: Array<Badge>;
  badgeCategories: Array<BadgeCategory>;
  grades: Array<Grade>;
  lessonsForSubject: Array<Lesson>;
  quiz?: Maybe<Quiz>;
  quizResults?: Maybe<QuizResult>;
  studySchedule: Array<StudySchedule>;
  subjectsForUserGrade: Array<Subject>;
  todaySchedule: DailySchedule;
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

export type SocialActionResponse = {
  __typename?: 'SocialActionResponse';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type StudySchedule = {
  __typename?: 'StudySchedule';
  completionPercentage?: Maybe<Scalars['Float']['output']>;
  dayName: Scalars['String']['output'];
  dayOfWeek: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  isComplete?: Maybe<Scalars['Boolean']['output']>;
  lessonGoal: Scalars['Int']['output'];
  lessonsCompleted?: Maybe<Scalars['Int']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  quizGoal: Scalars['Int']['output'];
  quizzesCompleted?: Maybe<Scalars['Int']['output']>;
  subject: Subject;
};

export type StudyScheduleInput = {
  dayOfWeek: Scalars['Int']['input'];
  lessonGoal?: InputMaybe<Scalars['Int']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  quizGoal?: InputMaybe<Scalars['Int']['input']>;
  subjectId: Scalars['ID']['input'];
};

export type Subject = {
  __typename?: 'Subject';
  chaptersCount?: Maybe<Scalars['Int']['output']>;
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

export type LoginMutation = {
  __typename?: 'Mutation';
  login: {
    __typename?: 'AuthPayload';
    access_token: string;
    token_type: string;
    expires_in: number;
    user: {
      __typename?: 'User';
      id: string;
      name: string;
      email: string;
      grade: { __typename?: 'Grade'; id: string; name: string };
    };
  };
};

export type RegisterMutationVariables = Exact<{
  name: Scalars['String']['input'];
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  password_confirmation: Scalars['String']['input'];
  grade_id: Scalars['ID']['input'];
}>;

export type RegisterMutation = {
  __typename?: 'Mutation';
  register: {
    __typename?: 'AuthPayload';
    access_token: string;
    token_type: string;
    expires_in: number;
    user: {
      __typename?: 'User';
      id: string;
      name: string;
      email: string;
      grade: { __typename?: 'Grade'; id: string; name: string };
    };
  };
};

export type GetGradesQueryVariables = Exact<{ [key: string]: never }>;

export type GetGradesQuery = {
  __typename?: 'Query';
  grades: Array<{ __typename?: 'Grade'; id: string; name: string }>;
};

export type DeleteAccountMutationVariables = Exact<{ [key: string]: never }>;

export type DeleteAccountMutation = {
  __typename?: 'Mutation';
  deleteAccount: { __typename?: 'SocialActionResponse'; success: boolean; message?: string | null };
};

export type ForgotPasswordMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;

export type ForgotPasswordMutation = {
  __typename?: 'Mutation';
  forgotPassword: {
    __typename?: 'SocialActionResponse';
    success: boolean;
    message?: string | null;
  };
};

export type GetAllBadgesQueryVariables = Exact<{ [key: string]: never }>;

export type GetAllBadgesQuery = {
  __typename?: 'Query';
  allBadges: Array<{
    __typename?: 'Badge';
    id: string;
    name: string;
    description?: string | null;
    logoUrl?: string | null;
    awardedAt?: string | null;
    rulesPreview?: string | null;
    category: {
      __typename?: 'BadgeCategory';
      id: string;
      name: string;
      icon?: string | null;
      color?: string | null;
    };
    rules: Array<{
      __typename?: 'BadgeRule';
      id: string;
      conditionType: string;
      operator: string;
      value: string;
      valueEnd?: string | null;
      timeframe?: string | null;
      scoreThreshold?: number | null;
      description?: string | null;
      subject?: { __typename?: 'Subject'; id: string; name: string } | null;
    }>;
  }>;
};

export type GetBadgeCategoriesQueryVariables = Exact<{ [key: string]: never }>;

export type GetBadgeCategoriesQuery = {
  __typename?: 'Query';
  badgeCategories: Array<{
    __typename?: 'BadgeCategory';
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    badgeCount?: number | null;
  }>;
};

export type StudyScheduleQueryVariables = Exact<{ [key: string]: never }>;

export type StudyScheduleQuery = {
  __typename?: 'Query';
  studySchedule: Array<{
    __typename?: 'StudySchedule';
    id: string;
    dayOfWeek: number;
    dayName: string;
    lessonGoal: number;
    quizGoal: number;
    notes?: string | null;
    subject: { __typename?: 'Subject'; id: string; name: string };
  }>;
};

export type TodayScheduleQueryVariables = Exact<{ [key: string]: never }>;

export type TodayScheduleQuery = {
  __typename?: 'Query';
  todaySchedule: {
    __typename?: 'DailySchedule';
    date: string;
    dayName: string;
    dayOfWeek: number;
    schedule: Array<{
      __typename?: 'StudySchedule';
      id: string;
      dayOfWeek: number;
      lessonGoal: number;
      quizGoal: number;
      notes?: string | null;
      lessonsCompleted?: number | null;
      quizzesCompleted?: number | null;
      completionPercentage?: number | null;
      isComplete?: boolean | null;
      subject: { __typename?: 'Subject'; id: string; name: string };
    }>;
  };
};

export type SaveStudyScheduleMutationVariables = Exact<{
  entries: Array<StudyScheduleInput> | StudyScheduleInput;
}>;

export type SaveStudyScheduleMutation = {
  __typename?: 'Mutation';
  saveStudySchedule: Array<{
    __typename?: 'StudySchedule';
    id: string;
    dayOfWeek: number;
    dayName: string;
    lessonGoal: number;
    quizGoal: number;
    notes?: string | null;
    subject: { __typename?: 'Subject'; id: string; name: string };
  }>;
};

export type UserQuizHistoryQueryVariables = Exact<{ [key: string]: never }>;

export type UserQuizHistoryQuery = {
  __typename?: 'Query';
  userQuizHistory: Array<{
    __typename?: 'UserQuizHistory';
    id: string;
    name: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
    isPassed: boolean;
    subject: { __typename?: 'Subject'; id: string; name: string };
  }>;
};

export type SubjectsForUserGradeQueryVariables = Exact<{ [key: string]: never }>;

export type SubjectsForUserGradeQuery = {
  __typename?: 'Query';
  subjectsForUserGrade: Array<{
    __typename?: 'Subject';
    id: string;
    name: string;
    description?: string | null;
    chaptersCount?: number | null;
  }>;
};

export type LessonsForSubjectQueryVariables = Exact<{
  subjectId: Scalars['ID']['input'];
}>;

export type LessonsForSubjectQuery = {
  __typename?: 'Query';
  lessonsForSubject: Array<{
    __typename?: 'Lesson';
    id: string;
    name: string;
    description?: string | null;
    chapter: { __typename?: 'Chapter'; id: string; name: string; order: number };
  }>;
};

export type QuizQueryVariables = Exact<{
  quizId: Scalars['ID']['input'];
}>;

export type QuizQuery = {
  __typename?: 'Query';
  quiz?: {
    __typename?: 'Quiz';
    id: string;
    name: string;
    questions: Array<{
      __typename?: 'QuizQuestion';
      id: string;
      question: string;
      answers: Array<string>;
      questionNumber: number;
    }>;
  } | null;
};

export type QuizResultsQueryVariables = Exact<{
  quizId: Scalars['ID']['input'];
}>;

export type QuizResultsQuery = {
  __typename?: 'Query';
  quizResults?: {
    __typename?: 'QuizResult';
    score: number;
    totalQuestions: number;
    isPassed: boolean;
    quiz: { __typename?: 'Quiz'; id: string; name: string };
    answers: Array<{
      __typename?: 'UserQuizAnswer';
      selectedAnswer: string;
      isCorrect: boolean;
      question: {
        __typename?: 'Question';
        id: string;
        question: string;
        answer_1: string;
        explanation?: string | null;
      };
    }>;
  } | null;
};

export type StartQuizMutationVariables = Exact<{
  subjectId: Scalars['ID']['input'];
  lessonIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;

export type StartQuizMutation = {
  __typename?: 'Mutation';
  startQuiz: {
    __typename?: 'Quiz';
    id: string;
    name: string;
    questions: Array<{
      __typename?: 'QuizQuestion';
      id: string;
      question: string;
      answers: Array<string>;
      questionNumber: number;
    }>;
  };
};

export type SubmitQuizAnswersMutationVariables = Exact<{
  quizId: Scalars['ID']['input'];
  answers: Array<QuestionAnswerInput> | QuestionAnswerInput;
}>;

export type SubmitQuizAnswersMutation = {
  __typename?: 'Mutation';
  submitQuizAnswers: {
    __typename?: 'QuizSubmissionResult';
    score: number;
    totalQuestions: number;
    isPassed: boolean;
    quiz: { __typename?: 'Quiz'; id: string; name: string };
  };
};

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
export type LoginMutationFn = ApolloReactCommon.MutationFunction<
  LoginMutation,
  LoginMutationVariables
>;

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
export function useLoginMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<LoginMutation, LoginMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<LoginMutation, LoginMutationVariables>(
    LoginDocument,
    options,
  );
}
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = ApolloReactCommon.MutationResult<LoginMutation>;
export type LoginMutationOptions = ApolloReactCommon.BaseMutationOptions<
  LoginMutation,
  LoginMutationVariables
>;
export const RegisterDocument = gql`
  mutation Register(
    $name: String!
    $email: String!
    $password: String!
    $password_confirmation: String!
    $grade_id: ID!
  ) {
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
export type RegisterMutationFn = ApolloReactCommon.MutationFunction<
  RegisterMutation,
  RegisterMutationVariables
>;

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
export function useRegisterMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterMutation, RegisterMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<RegisterMutation, RegisterMutationVariables>(
    RegisterDocument,
    options,
  );
}
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = ApolloReactCommon.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RegisterMutation,
  RegisterMutationVariables
>;
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
export function useGetGradesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<GetGradesQuery, GetGradesQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetGradesQuery, GetGradesQueryVariables>(
    GetGradesDocument,
    options,
  );
}
export function useGetGradesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetGradesQuery, GetGradesQueryVariables>(
    GetGradesDocument,
    options,
  );
}
export function useGetGradesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetGradesQuery, GetGradesQueryVariables>(
    GetGradesDocument,
    options,
  );
}
export type GetGradesQueryHookResult = ReturnType<typeof useGetGradesQuery>;
export type GetGradesLazyQueryHookResult = ReturnType<typeof useGetGradesLazyQuery>;
export type GetGradesSuspenseQueryHookResult = ReturnType<typeof useGetGradesSuspenseQuery>;
export type GetGradesQueryResult = ApolloReactCommon.QueryResult<
  GetGradesQuery,
  GetGradesQueryVariables
>;
export const DeleteAccountDocument = gql`
  mutation DeleteAccount {
    deleteAccount {
      success
      message
    }
  }
`;
export type DeleteAccountMutationFn = ApolloReactCommon.MutationFunction<
  DeleteAccountMutation,
  DeleteAccountMutationVariables
>;

/**
 * __useDeleteAccountMutation__
 *
 * To run a mutation, you first call `useDeleteAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAccountMutation, { data, loading, error }] = useDeleteAccountMutation({
 *   variables: {
 *   },
 * });
 */
export function useDeleteAccountMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteAccountMutation,
    DeleteAccountMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeleteAccountMutation, DeleteAccountMutationVariables>(
    DeleteAccountDocument,
    options,
  );
}
export type DeleteAccountMutationHookResult = ReturnType<typeof useDeleteAccountMutation>;
export type DeleteAccountMutationResult = ApolloReactCommon.MutationResult<DeleteAccountMutation>;
export type DeleteAccountMutationOptions = ApolloReactCommon.BaseMutationOptions<
  DeleteAccountMutation,
  DeleteAccountMutationVariables
>;
export const ForgotPasswordDocument = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;
export type ForgotPasswordMutationFn = ApolloReactCommon.MutationFunction<
  ForgotPasswordMutation,
  ForgotPasswordMutationVariables
>;

/**
 * __useForgotPasswordMutation__
 *
 * To run a mutation, you first call `useForgotPasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useForgotPasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [forgotPasswordMutation, { data, loading, error }] = useForgotPasswordMutation({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useForgotPasswordMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ForgotPasswordMutation,
    ForgotPasswordMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<ForgotPasswordMutation, ForgotPasswordMutationVariables>(
    ForgotPasswordDocument,
    options,
  );
}
export type ForgotPasswordMutationHookResult = ReturnType<typeof useForgotPasswordMutation>;
export type ForgotPasswordMutationResult = ApolloReactCommon.MutationResult<ForgotPasswordMutation>;
export type ForgotPasswordMutationOptions = ApolloReactCommon.BaseMutationOptions<
  ForgotPasswordMutation,
  ForgotPasswordMutationVariables
>;
export const GetAllBadgesDocument = gql`
  query getAllBadges {
    allBadges {
      id
      name
      description
      logoUrl
      awardedAt
      rulesPreview
      category {
        id
        name
        icon
        color
      }
      rules {
        id
        conditionType
        operator
        value
        valueEnd
        subject {
          id
          name
        }
        timeframe
        scoreThreshold
        description
      }
    }
  }
`;

/**
 * __useGetAllBadgesQuery__
 *
 * To run a query within a React component, call `useGetAllBadgesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllBadgesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAllBadgesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAllBadgesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<GetAllBadgesQuery, GetAllBadgesQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetAllBadgesQuery, GetAllBadgesQueryVariables>(
    GetAllBadgesDocument,
    options,
  );
}
export function useGetAllBadgesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetAllBadgesQuery,
    GetAllBadgesQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetAllBadgesQuery, GetAllBadgesQueryVariables>(
    GetAllBadgesDocument,
    options,
  );
}
export function useGetAllBadgesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetAllBadgesQuery, GetAllBadgesQueryVariables>,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetAllBadgesQuery, GetAllBadgesQueryVariables>(
    GetAllBadgesDocument,
    options,
  );
}
export type GetAllBadgesQueryHookResult = ReturnType<typeof useGetAllBadgesQuery>;
export type GetAllBadgesLazyQueryHookResult = ReturnType<typeof useGetAllBadgesLazyQuery>;
export type GetAllBadgesSuspenseQueryHookResult = ReturnType<typeof useGetAllBadgesSuspenseQuery>;
export type GetAllBadgesQueryResult = ApolloReactCommon.QueryResult<
  GetAllBadgesQuery,
  GetAllBadgesQueryVariables
>;
export const GetBadgeCategoriesDocument = gql`
  query getBadgeCategories {
    badgeCategories {
      id
      name
      description
      icon
      color
      badgeCount
    }
  }
`;

/**
 * __useGetBadgeCategoriesQuery__
 *
 * To run a query within a React component, call `useGetBadgeCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBadgeCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBadgeCategoriesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetBadgeCategoriesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetBadgeCategoriesQuery,
    GetBadgeCategoriesQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetBadgeCategoriesQuery, GetBadgeCategoriesQueryVariables>(
    GetBadgeCategoriesDocument,
    options,
  );
}
export function useGetBadgeCategoriesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetBadgeCategoriesQuery,
    GetBadgeCategoriesQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetBadgeCategoriesQuery, GetBadgeCategoriesQueryVariables>(
    GetBadgeCategoriesDocument,
    options,
  );
}
export function useGetBadgeCategoriesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetBadgeCategoriesQuery,
        GetBadgeCategoriesQueryVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetBadgeCategoriesQuery,
    GetBadgeCategoriesQueryVariables
  >(GetBadgeCategoriesDocument, options);
}
export type GetBadgeCategoriesQueryHookResult = ReturnType<typeof useGetBadgeCategoriesQuery>;
export type GetBadgeCategoriesLazyQueryHookResult = ReturnType<
  typeof useGetBadgeCategoriesLazyQuery
>;
export type GetBadgeCategoriesSuspenseQueryHookResult = ReturnType<
  typeof useGetBadgeCategoriesSuspenseQuery
>;
export type GetBadgeCategoriesQueryResult = ApolloReactCommon.QueryResult<
  GetBadgeCategoriesQuery,
  GetBadgeCategoriesQueryVariables
>;
export const StudyScheduleDocument = gql`
  query StudySchedule {
    studySchedule {
      id
      subject {
        id
        name
      }
      dayOfWeek
      dayName
      lessonGoal
      quizGoal
      notes
    }
  }
`;

/**
 * __useStudyScheduleQuery__
 *
 * To run a query within a React component, call `useStudyScheduleQuery` and pass it any options that fit your needs.
 * When your component renders, `useStudyScheduleQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStudyScheduleQuery({
 *   variables: {
 *   },
 * });
 */
export function useStudyScheduleQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<StudyScheduleQuery, StudyScheduleQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<StudyScheduleQuery, StudyScheduleQueryVariables>(
    StudyScheduleDocument,
    options,
  );
}
export function useStudyScheduleLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    StudyScheduleQuery,
    StudyScheduleQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<StudyScheduleQuery, StudyScheduleQueryVariables>(
    StudyScheduleDocument,
    options,
  );
}
export function useStudyScheduleSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<StudyScheduleQuery, StudyScheduleQueryVariables>,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<StudyScheduleQuery, StudyScheduleQueryVariables>(
    StudyScheduleDocument,
    options,
  );
}
export type StudyScheduleQueryHookResult = ReturnType<typeof useStudyScheduleQuery>;
export type StudyScheduleLazyQueryHookResult = ReturnType<typeof useStudyScheduleLazyQuery>;
export type StudyScheduleSuspenseQueryHookResult = ReturnType<typeof useStudyScheduleSuspenseQuery>;
export type StudyScheduleQueryResult = ApolloReactCommon.QueryResult<
  StudyScheduleQuery,
  StudyScheduleQueryVariables
>;
export const TodayScheduleDocument = gql`
  query TodaySchedule {
    todaySchedule {
      date
      dayName
      dayOfWeek
      schedule {
        id
        subject {
          id
          name
        }
        dayOfWeek
        lessonGoal
        quizGoal
        notes
        lessonsCompleted
        quizzesCompleted
        completionPercentage
        isComplete
      }
    }
  }
`;

/**
 * __useTodayScheduleQuery__
 *
 * To run a query within a React component, call `useTodayScheduleQuery` and pass it any options that fit your needs.
 * When your component renders, `useTodayScheduleQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTodayScheduleQuery({
 *   variables: {
 *   },
 * });
 */
export function useTodayScheduleQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<TodayScheduleQuery, TodayScheduleQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<TodayScheduleQuery, TodayScheduleQueryVariables>(
    TodayScheduleDocument,
    options,
  );
}
export function useTodayScheduleLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    TodayScheduleQuery,
    TodayScheduleQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<TodayScheduleQuery, TodayScheduleQueryVariables>(
    TodayScheduleDocument,
    options,
  );
}
export function useTodayScheduleSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<TodayScheduleQuery, TodayScheduleQueryVariables>,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<TodayScheduleQuery, TodayScheduleQueryVariables>(
    TodayScheduleDocument,
    options,
  );
}
export type TodayScheduleQueryHookResult = ReturnType<typeof useTodayScheduleQuery>;
export type TodayScheduleLazyQueryHookResult = ReturnType<typeof useTodayScheduleLazyQuery>;
export type TodayScheduleSuspenseQueryHookResult = ReturnType<typeof useTodayScheduleSuspenseQuery>;
export type TodayScheduleQueryResult = ApolloReactCommon.QueryResult<
  TodayScheduleQuery,
  TodayScheduleQueryVariables
>;
export const SaveStudyScheduleDocument = gql`
  mutation SaveStudySchedule($entries: [StudyScheduleInput!]!) {
    saveStudySchedule(entries: $entries) {
      id
      subject {
        id
        name
      }
      dayOfWeek
      dayName
      lessonGoal
      quizGoal
      notes
    }
  }
`;
export type SaveStudyScheduleMutationFn = ApolloReactCommon.MutationFunction<
  SaveStudyScheduleMutation,
  SaveStudyScheduleMutationVariables
>;

/**
 * __useSaveStudyScheduleMutation__
 *
 * To run a mutation, you first call `useSaveStudyScheduleMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveStudyScheduleMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveStudyScheduleMutation, { data, loading, error }] = useSaveStudyScheduleMutation({
 *   variables: {
 *      entries: // value for 'entries'
 *   },
 * });
 */
export function useSaveStudyScheduleMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    SaveStudyScheduleMutation,
    SaveStudyScheduleMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    SaveStudyScheduleMutation,
    SaveStudyScheduleMutationVariables
  >(SaveStudyScheduleDocument, options);
}
export type SaveStudyScheduleMutationHookResult = ReturnType<typeof useSaveStudyScheduleMutation>;
export type SaveStudyScheduleMutationResult =
  ApolloReactCommon.MutationResult<SaveStudyScheduleMutation>;
export type SaveStudyScheduleMutationOptions = ApolloReactCommon.BaseMutationOptions<
  SaveStudyScheduleMutation,
  SaveStudyScheduleMutationVariables
>;
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
export function useUserQuizHistoryQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    UserQuizHistoryQuery,
    UserQuizHistoryQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>(
    UserQuizHistoryDocument,
    options,
  );
}
export function useUserQuizHistoryLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    UserQuizHistoryQuery,
    UserQuizHistoryQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>(
    UserQuizHistoryDocument,
    options,
  );
}
export function useUserQuizHistorySuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        UserQuizHistoryQuery,
        UserQuizHistoryQueryVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>(
    UserQuizHistoryDocument,
    options,
  );
}
export type UserQuizHistoryQueryHookResult = ReturnType<typeof useUserQuizHistoryQuery>;
export type UserQuizHistoryLazyQueryHookResult = ReturnType<typeof useUserQuizHistoryLazyQuery>;
export type UserQuizHistorySuspenseQueryHookResult = ReturnType<
  typeof useUserQuizHistorySuspenseQuery
>;
export type UserQuizHistoryQueryResult = ApolloReactCommon.QueryResult<
  UserQuizHistoryQuery,
  UserQuizHistoryQueryVariables
>;
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
export function useSubjectsForUserGradeQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    SubjectsForUserGradeQuery,
    SubjectsForUserGradeQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>(
    SubjectsForUserGradeDocument,
    options,
  );
}
export function useSubjectsForUserGradeLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    SubjectsForUserGradeQuery,
    SubjectsForUserGradeQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    SubjectsForUserGradeQuery,
    SubjectsForUserGradeQueryVariables
  >(SubjectsForUserGradeDocument, options);
}
export function useSubjectsForUserGradeSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        SubjectsForUserGradeQuery,
        SubjectsForUserGradeQueryVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    SubjectsForUserGradeQuery,
    SubjectsForUserGradeQueryVariables
  >(SubjectsForUserGradeDocument, options);
}
export type SubjectsForUserGradeQueryHookResult = ReturnType<typeof useSubjectsForUserGradeQuery>;
export type SubjectsForUserGradeLazyQueryHookResult = ReturnType<
  typeof useSubjectsForUserGradeLazyQuery
>;
export type SubjectsForUserGradeSuspenseQueryHookResult = ReturnType<
  typeof useSubjectsForUserGradeSuspenseQuery
>;
export type SubjectsForUserGradeQueryResult = ApolloReactCommon.QueryResult<
  SubjectsForUserGradeQuery,
  SubjectsForUserGradeQueryVariables
>;
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
export function useLessonsForSubjectQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    LessonsForSubjectQuery,
    LessonsForSubjectQueryVariables
  > &
    ({ variables: LessonsForSubjectQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>(
    LessonsForSubjectDocument,
    options,
  );
}
export function useLessonsForSubjectLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    LessonsForSubjectQuery,
    LessonsForSubjectQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>(
    LessonsForSubjectDocument,
    options,
  );
}
export function useLessonsForSubjectSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        LessonsForSubjectQuery,
        LessonsForSubjectQueryVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>(
    LessonsForSubjectDocument,
    options,
  );
}
export type LessonsForSubjectQueryHookResult = ReturnType<typeof useLessonsForSubjectQuery>;
export type LessonsForSubjectLazyQueryHookResult = ReturnType<typeof useLessonsForSubjectLazyQuery>;
export type LessonsForSubjectSuspenseQueryHookResult = ReturnType<
  typeof useLessonsForSubjectSuspenseQuery
>;
export type LessonsForSubjectQueryResult = ApolloReactCommon.QueryResult<
  LessonsForSubjectQuery,
  LessonsForSubjectQueryVariables
>;
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
export function useQuizQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<QuizQuery, QuizQueryVariables> &
    ({ variables: QuizQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<QuizQuery, QuizQueryVariables>(QuizDocument, options);
}
export function useQuizLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<QuizQuery, QuizQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<QuizQuery, QuizQueryVariables>(QuizDocument, options);
}
export function useQuizSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<QuizQuery, QuizQueryVariables>,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<QuizQuery, QuizQueryVariables>(QuizDocument, options);
}
export type QuizQueryHookResult = ReturnType<typeof useQuizQuery>;
export type QuizLazyQueryHookResult = ReturnType<typeof useQuizLazyQuery>;
export type QuizSuspenseQueryHookResult = ReturnType<typeof useQuizSuspenseQuery>;
export type QuizQueryResult = ApolloReactCommon.QueryResult<QuizQuery, QuizQueryVariables>;
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
export function useQuizResultsQuery(
  baseOptions: ApolloReactHooks.QueryHookOptions<QuizResultsQuery, QuizResultsQueryVariables> &
    ({ variables: QuizResultsQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<QuizResultsQuery, QuizResultsQueryVariables>(
    QuizResultsDocument,
    options,
  );
}
export function useQuizResultsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<QuizResultsQuery, QuizResultsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<QuizResultsQuery, QuizResultsQueryVariables>(
    QuizResultsDocument,
    options,
  );
}
export function useQuizResultsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<QuizResultsQuery, QuizResultsQueryVariables>,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<QuizResultsQuery, QuizResultsQueryVariables>(
    QuizResultsDocument,
    options,
  );
}
export type QuizResultsQueryHookResult = ReturnType<typeof useQuizResultsQuery>;
export type QuizResultsLazyQueryHookResult = ReturnType<typeof useQuizResultsLazyQuery>;
export type QuizResultsSuspenseQueryHookResult = ReturnType<typeof useQuizResultsSuspenseQuery>;
export type QuizResultsQueryResult = ApolloReactCommon.QueryResult<
  QuizResultsQuery,
  QuizResultsQueryVariables
>;
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
export type StartQuizMutationFn = ApolloReactCommon.MutationFunction<
  StartQuizMutation,
  StartQuizMutationVariables
>;

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
export function useStartQuizMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<StartQuizMutation, StartQuizMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<StartQuizMutation, StartQuizMutationVariables>(
    StartQuizDocument,
    options,
  );
}
export type StartQuizMutationHookResult = ReturnType<typeof useStartQuizMutation>;
export type StartQuizMutationResult = ApolloReactCommon.MutationResult<StartQuizMutation>;
export type StartQuizMutationOptions = ApolloReactCommon.BaseMutationOptions<
  StartQuizMutation,
  StartQuizMutationVariables
>;
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
export type SubmitQuizAnswersMutationFn = ApolloReactCommon.MutationFunction<
  SubmitQuizAnswersMutation,
  SubmitQuizAnswersMutationVariables
>;

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
export function useSubmitQuizAnswersMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    SubmitQuizAnswersMutation,
    SubmitQuizAnswersMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    SubmitQuizAnswersMutation,
    SubmitQuizAnswersMutationVariables
  >(SubmitQuizAnswersDocument, options);
}
export type SubmitQuizAnswersMutationHookResult = ReturnType<typeof useSubmitQuizAnswersMutation>;
export type SubmitQuizAnswersMutationResult =
  ApolloReactCommon.MutationResult<SubmitQuizAnswersMutation>;
export type SubmitQuizAnswersMutationOptions = ApolloReactCommon.BaseMutationOptions<
  SubmitQuizAnswersMutation,
  SubmitQuizAnswersMutationVariables
>;
