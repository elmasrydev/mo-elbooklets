import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client/react';
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
  descriptionAr?: Maybe<Scalars['String']['output']>;
  descriptionEn?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nameAr?: Maybe<Scalars['String']['output']>;
  nameEn?: Maybe<Scalars['String']['output']>;
  rules: Array<BadgeRule>;
  rulesPreview: Scalars['String']['output'];
};

export type BadgeCategory = {
  __typename?: 'BadgeCategory';
  activeBadgeCount: Scalars['Int']['output'];
  badgeCount: Scalars['Int']['output'];
  color?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  descriptionAr?: Maybe<Scalars['String']['output']>;
  descriptionEn?: Maybe<Scalars['String']['output']>;
  displayOrder: Scalars['Int']['output'];
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  nameAr?: Maybe<Scalars['String']['output']>;
  nameEn?: Maybe<Scalars['String']['output']>;
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

export type BookmarkResponse = {
  __typename?: 'BookmarkResponse';
  is_bookmarked: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
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

export type LessonBookmark = {
  __typename?: 'LessonBookmark';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  lessonPoint: LessonPoint;
  note?: Maybe<Scalars['String']['output']>;
};

export type LessonNote = {
  __typename?: 'LessonNote';
  content: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lessonPoint: LessonPoint;
  updatedAt: Scalars['DateTime']['output'];
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
  deleteLessonNote: NoteResponse;
  deletePointNote: SavedPointResult;
  forgotPassword: SocialActionResponse;
  login: AuthPayload;
  publishQuizToFeed: SocialActionResponse;
  register: AuthPayload;
  removeSavedPoint: SavedPointResult;
  saveLessonNote: NoteResponse;
  savePointNote: SavedPointResult;
  saveStudySchedule: Array<StudySchedule>;
  startQuiz: Quiz;
  submitQuizAnswers: QuizSubmissionResult;
  updatePassword: SocialActionResponse;
  toggleLessonBookmark: BookmarkResponse;
  toggleSavedPointBookmark: SavedPointResult;
};

export type MutationDeleteLessonNoteArgs = {
  lessonPointId: Scalars['ID']['input'];
};

export type MutationDeletePointNoteArgs = {
  lessonPointId: Scalars['ID']['input'];
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

export type MutationRemoveSavedPointArgs = {
  lessonPointId: Scalars['ID']['input'];
};

export type MutationSaveLessonNoteArgs = {
  lessonPointId: Scalars['ID']['input'];
  note: Scalars['String']['input'];
};

export type MutationSavePointNoteArgs = {
  lessonId: Scalars['ID']['input'];
  lessonPointId: Scalars['ID']['input'];
  noteContent: Scalars['String']['input'];
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

export type MutationUpdatePasswordArgs = {
  input: UpdatePasswordInput;
export type MutationToggleLessonBookmarkArgs = {
  lessonPointId: Scalars['ID']['input'];
};

export type MutationToggleSavedPointBookmarkArgs = {
  lessonId: Scalars['ID']['input'];
  lessonPointId: Scalars['ID']['input'];
};

export type NoteResponse = {
  __typename?: 'NoteResponse';
  message?: Maybe<Scalars['String']['output']>;
  note?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type Query = {
  __typename?: 'Query';
  allBadges: Array<Badge>;
  badgeCategories: Array<BadgeCategory>;
  grades: Array<Grade>;
  lessonsForSubject: Array<Lesson>;
  mySavedPoints: Array<UserSavedPoint>;
  quiz?: Maybe<Quiz>;
  quizResults?: Maybe<QuizResult>;
  studySchedule: Array<StudySchedule>;
  subjectsForUserGrade: Array<Subject>;
  todaySchedule: DailySchedule;
  userBookmarks: Array<LessonBookmark>;
  userNotes: Array<LessonNote>;
  userQuizHistory: Array<UserQuizHistory>;
};

export type QueryLessonsForSubjectArgs = {
  subjectId: Scalars['ID']['input'];
};

export type QueryMySavedPointsArgs = {
  lessonId?: InputMaybe<Scalars['ID']['input']>;
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

export type SavedPointResult = {
  __typename?: 'SavedPointResult';
  message?: Maybe<Scalars['String']['output']>;
  savedPoint?: Maybe<UserSavedPoint>;
  success: Scalars['Boolean']['output'];
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

export type UpdatePasswordInput = {
  newPassword: Scalars['String']['input'];
  newPasswordConfirmation: Scalars['String']['input'];
  oldPassword: Scalars['String']['input'];
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

export type UserSavedPoint = {
  __typename?: 'UserSavedPoint';
  created_at: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  is_bookmarked: Scalars['Boolean']['output'];
  lesson: Lesson;
  lessonPoint: LessonPoint;
  note_content?: Maybe<Scalars['String']['output']>;
  updated_at: Scalars['DateTime']['output'];
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

export type UpdatePasswordMutationVariables = Exact<{
  input: UpdatePasswordInput;
}>;

export type UpdatePasswordMutation = {
  __typename?: 'Mutation';
  updatePassword: {
    __typename?: 'SocialActionResponse';
    success: boolean;
    message?: string | null;
  };
};

export type GetBadgesScreenDataQueryVariables = Exact<{ [key: string]: never }>;

export type GetBadgesScreenDataQuery = {
  __typename?: 'Query';
  badgeCategories: Array<{
    __typename?: 'BadgeCategory';
    id: string;
    name: string;
    nameAr?: string | null;
    nameEn?: string | null;
    icon?: string | null;
    color?: string | null;
    displayOrder: number;
    badgeCount: number;
  }>;
  allBadges: Array<{
    __typename?: 'Badge';
    id: string;
    name: string;
    nameAr?: string | null;
    nameEn?: string | null;
    description?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
    logoUrl?: string | null;
    awardedAt?: string | null;
    rulesPreview: string;
    category: { __typename?: 'BadgeCategory'; id: string };
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

export type ToggleSavedPointBookmarkMutationVariables = Exact<{
  lessonId: Scalars['ID']['input'];
  lessonPointId: Scalars['ID']['input'];
}>;

export type ToggleSavedPointBookmarkMutation = {
  __typename?: 'Mutation';
  toggleSavedPointBookmark: {
    __typename?: 'SavedPointResult';
    success: boolean;
    message?: string | null;
    savedPoint?: {
      __typename?: 'UserSavedPoint';
      id: string;
      is_bookmarked: boolean;
      note_content?: string | null;
    } | null;
  };
};

export type SavePointNoteMutationVariables = Exact<{
  lessonId: Scalars['ID']['input'];
  lessonPointId: Scalars['ID']['input'];
  noteContent: Scalars['String']['input'];
}>;

export type SavePointNoteMutation = {
  __typename?: 'Mutation';
  savePointNote: {
    __typename?: 'SavedPointResult';
    success: boolean;
    message?: string | null;
    savedPoint?: {
      __typename?: 'UserSavedPoint';
      id: string;
      is_bookmarked: boolean;
      note_content?: string | null;
    } | null;
  };
};

export type DeletePointNoteMutationVariables = Exact<{
  lessonPointId: Scalars['ID']['input'];
}>;

export type DeletePointNoteMutation = {
  __typename?: 'Mutation';
  deletePointNote: {
    __typename?: 'SavedPointResult';
    success: boolean;
    message?: string | null;
    savedPoint?: {
      __typename?: 'UserSavedPoint';
      id: string;
      is_bookmarked: boolean;
      note_content?: string | null;
    } | null;
  };
};

export type RemoveSavedPointMutationVariables = Exact<{
  lessonPointId: Scalars['ID']['input'];
}>;

export type RemoveSavedPointMutation = {
  __typename?: 'Mutation';
  removeSavedPoint: { __typename?: 'SavedPointResult'; success: boolean; message?: string | null };
};

export type MySavedPointsQueryVariables = Exact<{
  lessonId?: InputMaybe<Scalars['ID']['input']>;
}>;

export type MySavedPointsQuery = {
  __typename?: 'Query';
  mySavedPoints: Array<{
    __typename?: 'UserSavedPoint';
    id: string;
    is_bookmarked: boolean;
    note_content?: string | null;
    created_at: string;
    updated_at: string;
    lesson: {
      __typename?: 'Lesson';
      id: string;
      name: string;
      chapter: { __typename?: 'Chapter'; id: string; name: string };
    };
    lessonPoint: {
      __typename?: 'LessonPoint';
      id: string;
      title: string;
      explanation?: string | null;
      order: number;
    };
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
// @ts-ignore
export function useGetGradesSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>,
): ApolloReactHooks.UseSuspenseQueryResult<GetGradesQuery, GetGradesQueryVariables>;
export function useGetGradesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>,
): ApolloReactHooks.UseSuspenseQueryResult<GetGradesQuery | undefined, GetGradesQueryVariables>;
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
export const UpdatePasswordDocument = gql`
  mutation UpdatePassword($input: UpdatePasswordInput!) {
    updatePassword(input: $input) {
      success
      message
    }
  }
`;
export type UpdatePasswordMutationFn = ApolloReactCommon.MutationFunction<
  UpdatePasswordMutation,
  UpdatePasswordMutationVariables
>;

/**
 * __useUpdatePasswordMutation__
 *
 * To run a mutation, you first call `useUpdatePasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePasswordMutation, { data, loading, error }] = useUpdatePasswordMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePasswordMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdatePasswordMutation,
    UpdatePasswordMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<UpdatePasswordMutation, UpdatePasswordMutationVariables>(
    UpdatePasswordDocument,
    options,
  );
}
export type UpdatePasswordMutationHookResult = ReturnType<typeof useUpdatePasswordMutation>;
export type UpdatePasswordMutationResult = ApolloReactCommon.MutationResult<UpdatePasswordMutation>;
export type UpdatePasswordMutationOptions = ApolloReactCommon.BaseMutationOptions<
  UpdatePasswordMutation,
  UpdatePasswordMutationVariables
>;
export const GetBadgesScreenDataDocument = gql`
  query GetBadgesScreenData {
    badgeCategories {
      id
      name
      nameAr
      nameEn
      icon
      color
      displayOrder
      badgeCount
    }
    allBadges {
      id
      name
      nameAr
      nameEn
      description
      descriptionAr
      descriptionEn
      logoUrl
      awardedAt
      rulesPreview
      category {
        id
      }
    }
  }
`;

/**
 * __useGetBadgesScreenDataQuery__
 *
 * To run a query within a React component, call `useGetBadgesScreenDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBadgesScreenDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBadgesScreenDataQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetBadgesScreenDataQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetBadgesScreenDataQuery,
    GetBadgesScreenDataQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetBadgesScreenDataQuery, GetBadgesScreenDataQueryVariables>(
    GetBadgesScreenDataDocument,
    options,
  );
}
export function useGetBadgesScreenDataLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetBadgesScreenDataQuery,
    GetBadgesScreenDataQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetBadgesScreenDataQuery, GetBadgesScreenDataQueryVariables>(
    GetBadgesScreenDataDocument,
    options,
  );
}
// @ts-ignore
export function useGetBadgesScreenDataSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    GetBadgesScreenDataQuery,
    GetBadgesScreenDataQueryVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetBadgesScreenDataQuery,
  GetBadgesScreenDataQueryVariables
>;
export function useGetBadgesScreenDataSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetBadgesScreenDataQuery,
        GetBadgesScreenDataQueryVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetBadgesScreenDataQuery | undefined,
  GetBadgesScreenDataQueryVariables
>;
export function useGetBadgesScreenDataSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetBadgesScreenDataQuery,
        GetBadgesScreenDataQueryVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetBadgesScreenDataQuery,
    GetBadgesScreenDataQueryVariables
  >(GetBadgesScreenDataDocument, options);
}
export type GetBadgesScreenDataQueryHookResult = ReturnType<typeof useGetBadgesScreenDataQuery>;
export type GetBadgesScreenDataLazyQueryHookResult = ReturnType<
  typeof useGetBadgesScreenDataLazyQuery
>;
export type GetBadgesScreenDataSuspenseQueryHookResult = ReturnType<
  typeof useGetBadgesScreenDataSuspenseQuery
>;
export type GetBadgesScreenDataQueryResult = ApolloReactCommon.QueryResult<
  GetBadgesScreenDataQuery,
  GetBadgesScreenDataQueryVariables
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
// @ts-ignore
export function useStudyScheduleSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    StudyScheduleQuery,
    StudyScheduleQueryVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<StudyScheduleQuery, StudyScheduleQueryVariables>;
export function useStudyScheduleSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<StudyScheduleQuery, StudyScheduleQueryVariables>,
): ApolloReactHooks.UseSuspenseQueryResult<
  StudyScheduleQuery | undefined,
  StudyScheduleQueryVariables
>;
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
// @ts-ignore
export function useTodayScheduleSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    TodayScheduleQuery,
    TodayScheduleQueryVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<TodayScheduleQuery, TodayScheduleQueryVariables>;
export function useTodayScheduleSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<TodayScheduleQuery, TodayScheduleQueryVariables>,
): ApolloReactHooks.UseSuspenseQueryResult<
  TodayScheduleQuery | undefined,
  TodayScheduleQueryVariables
>;
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
export const ToggleSavedPointBookmarkDocument = gql`
  mutation ToggleSavedPointBookmark($lessonId: ID!, $lessonPointId: ID!) {
    toggleSavedPointBookmark(lessonId: $lessonId, lessonPointId: $lessonPointId) {
      success
      message
      savedPoint {
        id
        is_bookmarked
        note_content
      }
    }
  }
`;
export type ToggleSavedPointBookmarkMutationFn = ApolloReactCommon.MutationFunction<
  ToggleSavedPointBookmarkMutation,
  ToggleSavedPointBookmarkMutationVariables
>;

/**
 * __useToggleSavedPointBookmarkMutation__
 *
 * To run a mutation, you first call `useToggleSavedPointBookmarkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useToggleSavedPointBookmarkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [toggleSavedPointBookmarkMutation, { data, loading, error }] = useToggleSavedPointBookmarkMutation({
 *   variables: {
 *      lessonId: // value for 'lessonId'
 *      lessonPointId: // value for 'lessonPointId'
 *   },
 * });
 */
export function useToggleSavedPointBookmarkMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    ToggleSavedPointBookmarkMutation,
    ToggleSavedPointBookmarkMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    ToggleSavedPointBookmarkMutation,
    ToggleSavedPointBookmarkMutationVariables
  >(ToggleSavedPointBookmarkDocument, options);
}
export type ToggleSavedPointBookmarkMutationHookResult = ReturnType<
  typeof useToggleSavedPointBookmarkMutation
>;
export type ToggleSavedPointBookmarkMutationResult =
  ApolloReactCommon.MutationResult<ToggleSavedPointBookmarkMutation>;
export type ToggleSavedPointBookmarkMutationOptions = ApolloReactCommon.BaseMutationOptions<
  ToggleSavedPointBookmarkMutation,
  ToggleSavedPointBookmarkMutationVariables
>;
export const SavePointNoteDocument = gql`
  mutation SavePointNote($lessonId: ID!, $lessonPointId: ID!, $noteContent: String!) {
    savePointNote(lessonId: $lessonId, lessonPointId: $lessonPointId, noteContent: $noteContent) {
      success
      message
      savedPoint {
        id
        is_bookmarked
        note_content
      }
    }
  }
`;
export type SavePointNoteMutationFn = ApolloReactCommon.MutationFunction<
  SavePointNoteMutation,
  SavePointNoteMutationVariables
>;

/**
 * __useSavePointNoteMutation__
 *
 * To run a mutation, you first call `useSavePointNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSavePointNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [savePointNoteMutation, { data, loading, error }] = useSavePointNoteMutation({
 *   variables: {
 *      lessonId: // value for 'lessonId'
 *      lessonPointId: // value for 'lessonPointId'
 *      noteContent: // value for 'noteContent'
 *   },
 * });
 */
export function useSavePointNoteMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    SavePointNoteMutation,
    SavePointNoteMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<SavePointNoteMutation, SavePointNoteMutationVariables>(
    SavePointNoteDocument,
    options,
  );
}
export type SavePointNoteMutationHookResult = ReturnType<typeof useSavePointNoteMutation>;
export type SavePointNoteMutationResult = ApolloReactCommon.MutationResult<SavePointNoteMutation>;
export type SavePointNoteMutationOptions = ApolloReactCommon.BaseMutationOptions<
  SavePointNoteMutation,
  SavePointNoteMutationVariables
>;
export const DeletePointNoteDocument = gql`
  mutation DeletePointNote($lessonPointId: ID!) {
    deletePointNote(lessonPointId: $lessonPointId) {
      success
      message
      savedPoint {
        id
        is_bookmarked
        note_content
      }
    }
  }
`;
export type DeletePointNoteMutationFn = ApolloReactCommon.MutationFunction<
  DeletePointNoteMutation,
  DeletePointNoteMutationVariables
>;

/**
 * __useDeletePointNoteMutation__
 *
 * To run a mutation, you first call `useDeletePointNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePointNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePointNoteMutation, { data, loading, error }] = useDeletePointNoteMutation({
 *   variables: {
 *      lessonPointId: // value for 'lessonPointId'
 *   },
 * });
 */
export function useDeletePointNoteMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeletePointNoteMutation,
    DeletePointNoteMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeletePointNoteMutation, DeletePointNoteMutationVariables>(
    DeletePointNoteDocument,
    options,
  );
}
export type DeletePointNoteMutationHookResult = ReturnType<typeof useDeletePointNoteMutation>;
export type DeletePointNoteMutationResult =
  ApolloReactCommon.MutationResult<DeletePointNoteMutation>;
export type DeletePointNoteMutationOptions = ApolloReactCommon.BaseMutationOptions<
  DeletePointNoteMutation,
  DeletePointNoteMutationVariables
>;
export const RemoveSavedPointDocument = gql`
  mutation RemoveSavedPoint($lessonPointId: ID!) {
    removeSavedPoint(lessonPointId: $lessonPointId) {
      success
      message
    }
  }
`;
export type RemoveSavedPointMutationFn = ApolloReactCommon.MutationFunction<
  RemoveSavedPointMutation,
  RemoveSavedPointMutationVariables
>;

/**
 * __useRemoveSavedPointMutation__
 *
 * To run a mutation, you first call `useRemoveSavedPointMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveSavedPointMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeSavedPointMutation, { data, loading, error }] = useRemoveSavedPointMutation({
 *   variables: {
 *      lessonPointId: // value for 'lessonPointId'
 *   },
 * });
 */
export function useRemoveSavedPointMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RemoveSavedPointMutation,
    RemoveSavedPointMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<RemoveSavedPointMutation, RemoveSavedPointMutationVariables>(
    RemoveSavedPointDocument,
    options,
  );
}
export type RemoveSavedPointMutationHookResult = ReturnType<typeof useRemoveSavedPointMutation>;
export type RemoveSavedPointMutationResult =
  ApolloReactCommon.MutationResult<RemoveSavedPointMutation>;
export type RemoveSavedPointMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RemoveSavedPointMutation,
  RemoveSavedPointMutationVariables
>;
export const MySavedPointsDocument = gql`
  query MySavedPoints($lessonId: ID) {
    mySavedPoints(lessonId: $lessonId) {
      id
      is_bookmarked
      note_content
      created_at
      updated_at
      lesson {
        id
        name
        chapter {
          id
          name
        }
      }
      lessonPoint {
        id
        title
        explanation
        order
      }
    }
  }
`;

/**
 * __useMySavedPointsQuery__
 *
 * To run a query within a React component, call `useMySavedPointsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMySavedPointsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMySavedPointsQuery({
 *   variables: {
 *      lessonId: // value for 'lessonId'
 *   },
 * });
 */
export function useMySavedPointsQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<MySavedPointsQuery, MySavedPointsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<MySavedPointsQuery, MySavedPointsQueryVariables>(
    MySavedPointsDocument,
    options,
  );
}
export function useMySavedPointsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    MySavedPointsQuery,
    MySavedPointsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<MySavedPointsQuery, MySavedPointsQueryVariables>(
    MySavedPointsDocument,
    options,
  );
}
// @ts-ignore
export function useMySavedPointsSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    MySavedPointsQuery,
    MySavedPointsQueryVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<MySavedPointsQuery, MySavedPointsQueryVariables>;
export function useMySavedPointsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MySavedPointsQuery, MySavedPointsQueryVariables>,
): ApolloReactHooks.UseSuspenseQueryResult<
  MySavedPointsQuery | undefined,
  MySavedPointsQueryVariables
>;
export function useMySavedPointsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<MySavedPointsQuery, MySavedPointsQueryVariables>,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<MySavedPointsQuery, MySavedPointsQueryVariables>(
    MySavedPointsDocument,
    options,
  );
}
export type MySavedPointsQueryHookResult = ReturnType<typeof useMySavedPointsQuery>;
export type MySavedPointsLazyQueryHookResult = ReturnType<typeof useMySavedPointsLazyQuery>;
export type MySavedPointsSuspenseQueryHookResult = ReturnType<typeof useMySavedPointsSuspenseQuery>;
export type MySavedPointsQueryResult = ApolloReactCommon.QueryResult<
  MySavedPointsQuery,
  MySavedPointsQueryVariables
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
// @ts-ignore
export function useUserQuizHistorySuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    UserQuizHistoryQuery,
    UserQuizHistoryQueryVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>;
export function useUserQuizHistorySuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        UserQuizHistoryQuery,
        UserQuizHistoryQueryVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  UserQuizHistoryQuery | undefined,
  UserQuizHistoryQueryVariables
>;
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
// @ts-ignore
export function useSubjectsForUserGradeSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    SubjectsForUserGradeQuery,
    SubjectsForUserGradeQueryVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<
  SubjectsForUserGradeQuery,
  SubjectsForUserGradeQueryVariables
>;
export function useSubjectsForUserGradeSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        SubjectsForUserGradeQuery,
        SubjectsForUserGradeQueryVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  SubjectsForUserGradeQuery | undefined,
  SubjectsForUserGradeQueryVariables
>;
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
// @ts-ignore
export function useLessonsForSubjectSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    LessonsForSubjectQuery,
    LessonsForSubjectQueryVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>;
export function useLessonsForSubjectSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        LessonsForSubjectQuery,
        LessonsForSubjectQueryVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  LessonsForSubjectQuery | undefined,
  LessonsForSubjectQueryVariables
>;
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
// @ts-ignore
export function useQuizSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<QuizQuery, QuizQueryVariables>,
): ApolloReactHooks.UseSuspenseQueryResult<QuizQuery, QuizQueryVariables>;
export function useQuizSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<QuizQuery, QuizQueryVariables>,
): ApolloReactHooks.UseSuspenseQueryResult<QuizQuery | undefined, QuizQueryVariables>;
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
// @ts-ignore
export function useQuizResultsSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    QuizResultsQuery,
    QuizResultsQueryVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<QuizResultsQuery, QuizResultsQueryVariables>;
export function useQuizResultsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<QuizResultsQuery, QuizResultsQueryVariables>,
): ApolloReactHooks.UseSuspenseQueryResult<QuizResultsQuery | undefined, QuizResultsQueryVariables>;
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
