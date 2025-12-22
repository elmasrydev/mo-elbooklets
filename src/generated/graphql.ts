import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: string;
  Date: string;
};

export type User = {
  __typename?: 'User';
  id: Scalars['ID'];
  name: Scalars['String'];
  email: Scalars['String'];
  grade: Grade;
};

export type Grade = {
  __typename?: 'Grade';
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  access_token: Scalars['String'];
  token_type: Scalars['String'];
  expires_in: Scalars['Int'];
  user: User;
};

export type Subject = {
  __typename?: 'Subject';
  id: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  chaptersCount: Scalars['Int'];
};

export type Chapter = {
  __typename?: 'Chapter';
  id: Scalars['ID'];
  name: Scalars['String'];
  order: Scalars['Int'];
};

export type Lesson = {
  __typename?: 'Lesson';
  id: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  chapter: Chapter;
};

export type Quiz = {
  __typename?: 'Quiz';
  id: Scalars['ID'];
  name: Scalars['String'];
  questions: Array<QuizQuestion>;
};

export type QuizQuestion = {
  __typename?: 'QuizQuestion';
  id: Scalars['ID'];
  question: Scalars['String'];
  answers: Array<Scalars['String']>;
  questionNumber: Scalars['Int'];
};

export type UserQuizHistory = {
  __typename?: 'UserQuizHistory';
  id: Scalars['ID'];
  name: Scalars['String'];
  subject: Subject;
  score: Scalars['Int'];
  totalQuestions: Scalars['Int'];
  completedAt: Scalars['DateTime'];
  isPassed: Scalars['Boolean'];
};

export type QuizResult = {
  __typename?: 'QuizResult';
  quiz: Quiz;
  score: Scalars['Int'];
  totalQuestions: Scalars['Int'];
  isPassed: Scalars['Boolean'];
  answers: Array<UserQuizAnswer>;
};

export type UserQuizAnswer = {
  __typename?: 'UserQuizAnswer';
  question: Question;
  selectedAnswer: Scalars['String'];
  isCorrect: Scalars['Boolean'];
};

export type Question = {
  __typename?: 'Question';
  id: Scalars['ID'];
  question: Scalars['String'];
  answer_1: Scalars['String'];
  explanation?: Maybe<Scalars['String']>;
};

export type QuizSubmissionResult = {
  __typename?: 'QuizSubmissionResult';
  quiz: Quiz;
  score: Scalars['Int'];
  totalQuestions: Scalars['Int'];
  isPassed: Scalars['Boolean'];
};

export type QuestionAnswerInput = {
  questionId: Scalars['ID'];
  selectedAnswer?: InputMaybe<Scalars['String']>;
};

export type LoginMutationVariables = Exact<{
  email: Scalars['String'];
  password: Scalars['String'];
}>;

export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', access_token: string, token_type: string, expires_in: number, user: { __typename?: 'User', id: string, name: string, email: string, grade: { __typename?: 'Grade', id: string, name: string } } } };

export type RegisterMutationVariables = Exact<{
  name: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
  password_confirmation: Scalars['String'];
  grade_id: Scalars['ID'];
}>;

export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AuthPayload', access_token: string, token_type: string, expires_in: number, user: { __typename?: 'User', id: string, name: string, email: string, grade: { __typename?: 'Grade', id: string, name: string } } } };

export type UserQuizHistoryQueryVariables = Exact<{ [key: string]: never; }>;

export type UserQuizHistoryQuery = { __typename?: 'Query', userQuizHistory: Array<{ __typename?: 'UserQuizHistory', id: string, name: string, score: number, totalQuestions: number, completedAt: string, isPassed: boolean, subject: { __typename?: 'Subject', id: string, name: string } }> };

export type SubjectsForUserGradeQueryVariables = Exact<{ [key: string]: never; }>;

export type SubjectsForUserGradeQuery = { __typename?: 'Query', subjectsForUserGrade: Array<{ __typename?: 'Subject', id: string, name: string, description?: string | null, chaptersCount: number }> };

export type LessonsForSubjectQueryVariables = Exact<{
  subjectId: Scalars['ID'];
}>;

export type LessonsForSubjectQuery = { __typename?: 'Query', lessonsForSubject: Array<{ __typename?: 'Lesson', id: string, name: string, description?: string | null, chapter: { __typename?: 'Chapter', id: string, name: string, order: number } }> };

export type QuizQueryVariables = Exact<{
  quizId: Scalars['ID'];
}>;

export type QuizQuery = { __typename?: 'Query', quiz?: { __typename?: 'Quiz', id: string, name: string, questions: Array<{ __typename?: 'QuizQuestion', id: string, question: string, answers: Array<string>, questionNumber: number }> } | null };

export type QuizResultsQueryVariables = Exact<{
  quizId: Scalars['ID'];
}>;

export type QuizResultsQuery = { __typename?: 'Query', quizResults?: { __typename?: 'QuizResult', score: number, totalQuestions: number, isPassed: boolean, quiz: { __typename?: 'Quiz', id: string, name: string }, answers: Array<{ __typename?: 'UserQuizAnswer', selectedAnswer: string, isCorrect: boolean, question: { __typename?: 'Question', id: string, question: string, answer_1: string, explanation?: string | null } }> } | null };

export type StartQuizMutationVariables = Exact<{
  subjectId: Scalars['ID'];
  lessonIds: Array<Scalars['ID']> | Scalars['ID'];
}>;

export type StartQuizMutation = { __typename?: 'Mutation', startQuiz: { __typename?: 'Quiz', id: string, name: string, questions: Array<{ __typename?: 'QuizQuestion', id: string, question: string, answers: Array<string>, questionNumber: number }> } };

export type SubmitQuizAnswersMutationVariables = Exact<{
  quizId: Scalars['ID'];
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

export const RegisterDocument = gql`
    mutation Register($name: String!, $email: String!, $password: String!, $password_confirmation: String!, $grade_id: ID!) {
  register(name: $name, email: $email, password: $password, password_confirmation: $password_confirmation, grade_id: $grade_id) {
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
