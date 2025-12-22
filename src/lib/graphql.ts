import { gql } from '@apollo/client';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  grade_id?: string;
  grade?: Grade;
}

export interface Grade {
  id: string;
  name: string;
  description?: string;
}

export interface AuthPayload {
  access_token: string;
  token_type: string;
  user: User;
}

// Quiz-related types
export interface Subject {
  id: string;
  name: string;
  description?: string;
}

export interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  name: string;
}

export interface Quiz {
  id: string;
  name: string;
  subject: Subject;
  questions: QuizQuestion[];
  isCompleted: boolean;
  score?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  questionNumber: number;
  explanation?: string;
  difficulty: number;
}

export interface QuizResult {
  quiz: Quiz;
  score: number;
  totalQuestions: number;
  userAnswers: UserQuizAnswer[];
  isPassed: boolean;
}

export interface UserQuizAnswer {
  question: {
    id: string;
    question: string;
    answer_1: string;
  };
  selected_answer: string;
  is_correct: boolean;
  explanation?: string;
}

export interface UserQuizHistory {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
  score: number;
  totalQuestions: number;
  completedAt: string;
  isPassed: boolean;
}

// Queries
export const GET_GRADES = gql`
  query GetGrades {
    grades {
      id
      name
      description
    }
  }
`;

// Quiz Queries
export const SUBJECTS_FOR_USER_GRADE_QUERY = gql`
  query SubjectsForUserGrade {
    subjectsForUserGrade {
      id
      name
      description
    }
  }
`;

export const LESSONS_FOR_SUBJECT_QUERY = gql`
  query LessonsForSubject($subjectId: ID!) {
    lessonsForSubject(subjectId: $subjectId) {
      id
      name
      lessons {
        id
        name
      }
    }
  }
`;

export const QUIZ_QUERY = gql`
  query Quiz($quizId: ID!) {
    quiz(quizId: $quizId) {
      id
      name
      subject {
        id
        name
      }
      questions {
        id
        question
        answers
        questionNumber
        explanation
        difficulty
      }
      isCompleted
      score
    }
  }
`;

export const QUIZ_RESULTS_QUERY = gql`
  query QuizResults($quizId: ID!) {
    quizResults(quizId: $quizId) {
      quiz {
        id
        name
        subject {
          name
        }
      }
      score
      totalQuestions
      userAnswers {
        question {
          id
          question
          answer_1
        }
        selected_answer
        is_correct
        explanation
      }
      isPassed
    }
  }
`;

export const USER_QUIZ_HISTORY_QUERY = gql`
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

// Mutations
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      access_token
      token_type
      user {
        id
        name
        email
        mobile
        grade_id
        grade {
          id
          name
        }
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      access_token
      token_type
      user {
        id
        name
        email
        mobile
        grade_id
        grade {
          id
          name
        }
      }
    }
  }
`;

// Quiz Mutations
export const START_QUIZ_MUTATION = gql`
  mutation StartQuiz($subjectId: ID!, $lessonIds: [ID!]!) {
    startQuiz(subjectId: $subjectId, lessonIds: $lessonIds) {
      id
      name
      subject {
        id
        name
      }
    }
  }
`;

export const SUBMIT_QUIZ_ANSWERS_MUTATION = gql`
  mutation SubmitQuizAnswers($quizId: ID!, $answers: [QuestionAnswerInput!]!) {
    submitQuizAnswers(quizId: $quizId, answers: $answers) {
      score
      totalQuestions
      isPassed
    }
  }
`;

// Input types for TypeScript
export interface RegisterInput {
  name: string;
  email: string;
  mobile: string;
  password: string;
  grade_id: string;
}

export interface LoginInput {
  mobile: string;
  password: string;
}

export interface QuestionAnswerInput {
  questionId: string;
  selectedAnswer: string;
}
