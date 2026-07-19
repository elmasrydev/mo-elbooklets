/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** A single match mapping submitted by the student */
export type MatchPairInput = {
  leftId: string;
  rightId: string;
};

/** Question Answer Input */
export type QuestionAnswerInput = {
  /** match question: the chosen left->right mappings */
  matchPairs?: Array<MatchPairInput> | null | undefined;
  questionId: string;
  /** mcq / true_false / image / descriptive answer */
  selectedAnswer?: string | null | undefined;
  /** paragraph question: answers to each ordered sub-question */
  subAnswers?: Array<QuestionAnswerInput> | null | undefined;
};

/** Input for saving study schedule entries */
export type StudyScheduleInput = {
  dayOfWeek: number;
  lessonGoal: number;
  notes?: string | null | undefined;
  quizGoal: number;
  subjectId: string;
};

/** Why this user was suggested */
export type SuggestionReason = 'SAME_CITY' | 'SAME_SCHOOL';

export type UpdateNotificationPreferencesInput = {
  /** Enable or disable app notifications (badges, quizzes, lessons, etc.) */
  app_notifications_enabled?: boolean | null | undefined;
  /** Enable or disable social notifications. Ignored for parents. */
  social_notifications_enabled?: boolean | null | undefined;
};

/** Password update input */
export type UpdatePasswordInput = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export type GetGradesQueryVariables = Exact<{ [key: string]: never }>;

export type GetGradesQuery = { grades: Array<{ id: string; name: string }> };

export type DeleteAccountMutationVariables = Exact<{ [key: string]: never }>;

export type DeleteAccountMutation = { deleteAccount: { success: boolean; message: string | null } };

export type ForgotPasswordMutationVariables = Exact<{
  email: string;
}>;

export type ForgotPasswordMutation = {
  forgotPassword: { success: boolean; message: string | null };
};

export type UpdatePasswordMutationVariables = Exact<{
  input: UpdatePasswordInput;
}>;

export type UpdatePasswordMutation = {
  updatePassword: { success: boolean; message: string | null };
};

export type SendMobileOtpMutationVariables = Exact<{
  mobile: string;
  country_code?: string | null | undefined;
}>;

export type SendMobileOtpMutation = {
  sendMobileOtp: { success: boolean; message: string; expires_in: number };
};

export type VerifyMobileOtpMutationVariables = Exact<{
  otp: string;
}>;

export type VerifyMobileOtpMutation = {
  verifyMobileOtp: {
    success: boolean;
    message: string;
    user: {
      id: string;
      name: string;
      email: string | null;
      mobile: string;
      country_code: string | null;
      mobile_verified_at: string | null;
      gender: string | null;
      school_name: string | null;
      parent_mobile: string | null;
      grade_id: string | null;
      educational_system_id: string | null;
      governorate_id: string | null;
      city_id: string | null;
      is_subscribed: boolean;
      grade: { id: string; name: string } | null;
      educational_system: { id: string; name: string } | null;
      governorate: { id: string; name_ar: string; name_en: string } | null;
      city: { id: string; name_ar: string; name_en: string } | null;
    } | null;
  };
};

export type GetBadgesScreenDataQueryVariables = Exact<{ [key: string]: never }>;

export type GetBadgesScreenDataQuery = {
  badgeCategories: Array<{
    id: string;
    name: string;
    nameAr: string | null;
    nameEn: string | null;
    icon: string | null;
    color: string | null;
    displayOrder: number;
    badgeCount: number;
  }>;
  allBadges: Array<{
    id: string;
    name: string;
    nameAr: string | null;
    nameEn: string | null;
    description: string | null;
    descriptionAr: string | null;
    descriptionEn: string | null;
    logoUrl: string | null;
    awardedAt: string | null;
    rulesPreview: string;
    category: { id: string } | null;
  }>;
};

export type StudyScheduleQueryVariables = Exact<{ [key: string]: never }>;

export type StudyScheduleQuery = {
  studySchedule: Array<{
    id: string;
    dayOfWeek: number;
    dayName: string;
    lessonGoal: number;
    quizGoal: number;
    notes: string | null;
    subject: { id: string; name: string };
  }>;
};

export type TodayScheduleQueryVariables = Exact<{ [key: string]: never }>;

export type TodayScheduleQuery = {
  todaySchedule: {
    date: string;
    dayName: string;
    dayOfWeek: number;
    schedule: Array<{
      id: string;
      dayOfWeek: number;
      lessonGoal: number;
      quizGoal: number;
      notes: string | null;
      lessonsCompleted: number;
      quizzesCompleted: number;
      completionPercentage: number;
      isComplete: boolean;
      subject: { id: string; name: string };
    }>;
  };
};

export type SaveStudyScheduleMutationVariables = Exact<{
  entries: Array<StudyScheduleInput> | StudyScheduleInput;
}>;

export type SaveStudyScheduleMutation = {
  saveStudySchedule: Array<{
    id: string;
    dayOfWeek: number;
    dayName: string;
    lessonGoal: number;
    quizGoal: number;
    notes: string | null;
    subject: { id: string; name: string };
  }>;
};

export type LeaderboardQueryVariables = Exact<{
  subjectId?: string | null | undefined;
  filter?: string | null | undefined;
  limit?: number | null | undefined;
}>;

export type LeaderboardQuery = {
  leaderboard: {
    entries: Array<{
      id: string;
      name: string;
      totalQuizzes: number;
      avgScore: number;
      xp: number;
      isFollowing: boolean;
      rank: number;
      grade: { id: string; name: string };
      selectedAvatar: { url: string } | null;
    }>;
    userEntry: {
      id: string;
      name: string;
      totalQuizzes: number;
      avgScore: number;
      xp: number;
      isFollowing: boolean;
      rank: number;
      grade: { id: string; name: string };
      selectedAvatar: { url: string } | null;
    } | null;
  };
};

export type StudySubjectsQueryVariables = Exact<{ [key: string]: never }>;

export type StudySubjectsQuery = {
  subjectsForUserGrade: Array<{
    id: string;
    name: string;
    description: string | null;
    language: string | null;
    study_progress: number;
    quiz_progress: number;
    chapters: Array<{ id: string }>;
  }>;
};

export type StudyChaptersQueryVariables = Exact<{
  subjectId: string;
}>;

export type StudyChaptersQuery = {
  lessonsForSubject: Array<{
    id: string;
    name: string;
    lessons: Array<{
      id: string;
      name: string;
      summary: string | null;
      points: Array<string> | null;
      videoUrl: string | null;
      myInteraction: string | null;
      isLocked: boolean;
      lessonPoints: Array<{
        id: string;
        title: string;
        explanation: string | null;
        order: number;
        is_viewed: boolean;
      }>;
    }>;
  }>;
};

export type MySavedPointsQueryVariables = Exact<{
  lessonId?: string | null | undefined;
}>;

export type MySavedPointsQuery = {
  mySavedPoints: Array<{
    id: string;
    is_bookmarked: boolean;
    note_content: string | null;
    created_at: string;
    updated_at: string;
    lesson: {
      id: string;
      name: string;
      summary: string | null;
      points: Array<string> | null;
      videoUrl: string | null;
      myInteraction: string | null;
      lessonPoints: Array<{
        id: string;
        title: string;
        explanation: string | null;
        order: number;
        is_viewed: boolean;
      }>;
      chapter: { id: string; name: string } | null;
    };
    lessonPoint: { id: string; title: string; explanation: string | null; order: number };
  }>;
};

export type LessonDodProgressQueryVariables = Exact<{
  lessonId: string;
}>;

export type LessonDodProgressQuery = {
  lessonDODProgress: {
    lessonId: string;
    keyPointsViewed: number;
    keyPointsTotal: number;
    quizzesPassed: number;
    quizzesRequired: number;
    totalProgress: number;
    isComplete: boolean;
  };
};

export type RecordKeyPointViewMutationVariables = Exact<{
  lessonPointId: string;
}>;

export type RecordKeyPointViewMutation = { recordKeyPointView: boolean };

export type ToggleLessonInteractionMutationVariables = Exact<{
  lessonId: string;
  type: string;
}>;

export type ToggleLessonInteractionMutation = {
  toggleLessonInteraction: {
    success: boolean;
    interactionType: string | null;
    message: string | null;
  };
};

export type ToggleSavedPointBookmarkMutationVariables = Exact<{
  lessonId: string;
  lessonPointId: string;
}>;

export type ToggleSavedPointBookmarkMutation = {
  toggleSavedPointBookmark: {
    success: boolean;
    message: string | null;
    savedPoint: {
      id: string;
      is_bookmarked: boolean;
      note_content: string | null;
      lessonPoint: { id: string };
    } | null;
  };
};

export type SavePointNoteMutationVariables = Exact<{
  lessonId: string;
  lessonPointId: string;
  noteContent: string;
}>;

export type SavePointNoteMutation = {
  savePointNote: {
    success: boolean;
    message: string | null;
    savedPoint: {
      id: string;
      is_bookmarked: boolean;
      note_content: string | null;
      created_at: string;
      updated_at: string;
      lesson: { id: string; name: string; chapter: { id: string; name: string } | null };
      lessonPoint: { id: string; title: string; explanation: string | null; order: number };
    } | null;
  };
};

export type DeletePointNoteMutationVariables = Exact<{
  lessonPointId: string;
}>;

export type DeletePointNoteMutation = {
  deletePointNote: {
    success: boolean;
    message: string | null;
    savedPoint: {
      id: string;
      is_bookmarked: boolean;
      note_content: string | null;
      lessonPoint: { id: string };
    } | null;
  };
};

export type UserNotificationsQueryVariables = Exact<{
  page?: number | null | undefined;
  per_page?: number | null | undefined;
}>;

export type UserNotificationsQuery = {
  userNotifications: {
    total: number;
    unread_count: number;
    has_more: boolean;
    data: Array<{
      id: string;
      title: string;
      body: string | null;
      channel: string;
      event_slug: string | null;
      action_url: string | null;
      is_read: boolean;
      read_at: string | null;
      created_at: string;
    }>;
  };
};

export type MarkNotificationReadMutationVariables = Exact<{
  id: string;
}>;

export type MarkNotificationReadMutation = { markNotificationRead: { read_at: string | null } };

export type MarkAllNotificationsReadMutationVariables = Exact<{ [key: string]: never }>;

export type MarkAllNotificationsReadMutation = { markAllNotificationsRead: boolean };

export type ParentNotificationsQueryVariables = Exact<{
  page?: number | null | undefined;
  per_page?: number | null | undefined;
}>;

export type ParentNotificationsQuery = {
  parentNotifications: {
    total: number;
    unread_count: number;
    has_more: boolean;
    data: Array<{
      id: string;
      title: string;
      body: string | null;
      channel: string;
      event_slug: string | null;
      action_url: string | null;
      is_read: boolean;
      read_at: string | null;
      created_at: string;
    }>;
  };
};

export type ParentMarkNotificationReadMutationVariables = Exact<{
  id: string;
}>;

export type ParentMarkNotificationReadMutation = {
  parentMarkNotificationRead: { read_at: string | null };
};

export type ParentMarkAllNotificationsReadMutationVariables = Exact<{ [key: string]: never }>;

export type ParentMarkAllNotificationsReadMutation = { parentMarkAllNotificationsRead: boolean };

export type GetNotificationPreferencesQueryVariables = Exact<{ [key: string]: never }>;

export type GetNotificationPreferencesQuery = {
  notificationPreferences: {
    app_notifications_enabled: boolean;
    social_notifications_enabled: boolean | null;
  };
};

export type UpdateNotificationPreferencesMutationVariables = Exact<{
  input: UpdateNotificationPreferencesInput;
}>;

export type UpdateNotificationPreferencesMutation = {
  updateNotificationPreferences: {
    app_notifications_enabled: boolean;
    social_notifications_enabled: boolean | null;
  };
};

export type GetParentNotificationPreferencesQueryVariables = Exact<{ [key: string]: never }>;

export type GetParentNotificationPreferencesQuery = {
  parentNotificationPreferences: {
    app_notifications_enabled: boolean;
    social_notifications_enabled: boolean | null;
  };
};

export type ParentUpdateNotificationPreferencesMutationVariables = Exact<{
  input: UpdateNotificationPreferencesInput;
}>;

export type ParentUpdateNotificationPreferencesMutation = {
  parentUpdateNotificationPreferences: {
    app_notifications_enabled: boolean;
    social_notifications_enabled: boolean | null;
  };
};

export type ParentLinkRequestsQueryVariables = Exact<{ [key: string]: never }>;

export type ParentLinkRequestsQuery = {
  parentLinkRequests: Array<{
    id: string;
    status: string;
    initiated_by: string;
    created_at: string;
    parent: { name: string | null; mobile: string };
  }>;
};

export type SendParentLinkRequestMutationVariables = Exact<{
  mobile: string;
}>;

export type SendParentLinkRequestMutation = {
  sendParentLinkRequest: {
    id: string;
    status: string;
    initiated_by: string;
    parent: { name: string | null };
  };
};

export type RespondToParentLinkMutationVariables = Exact<{
  requestId: string;
  action: string;
}>;

export type RespondToParentLinkMutation = { respondToParentLink: { id: string; status: string } };

export type CancelParentLinkRequestMutationVariables = Exact<{
  requestId: string;
}>;

export type CancelParentLinkRequestMutation = {
  cancelParentLinkRequest: { success: boolean; message: string | null };
};

export type MyLinkedChildrenQueryVariables = Exact<{ [key: string]: never }>;

export type MyLinkedChildrenQuery = {
  linkedChildren: Array<{
    id: string;
    name: string;
    mobile: string | null;
    selectedAvatar: { url: string } | null;
    grade: { name: string } | null;
    educational_system: { name: string } | null;
  }>;
};

export type ParentChildRequestsQueryVariables = Exact<{ [key: string]: never }>;

export type ParentChildRequestsQuery = {
  parentChildRequests: Array<{
    id: string;
    status: string;
    initiated_by: string;
    created_at: string;
    child: { name: string; mobile: string; school_name: string | null };
  }>;
};

export type GetChildDashboardQueryVariables = Exact<{
  childId: string;
}>;

export type GetChildDashboardQuery = {
  childDashboard: {
    quizzes_solved: number;
    average_score: number;
    started_subjects_count: number;
    child: { name: string; selectedAvatar: { url: string } | null };
    subject_performance: Array<{ subject_name: string; quiz_count: number; avg_score: number }>;
    recent_activity: Array<{
      subject_name: string;
      score: number;
      total_questions: number;
      is_passed: boolean;
      completed_at: string;
    }>;
  };
};

export type UserQuizHistoryQueryVariables = Exact<{ [key: string]: never }>;

export type UserQuizHistoryQuery = {
  userQuizHistory: Array<{
    id: string;
    name: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
    isPassed: boolean;
    subject: { id: string; name: string; language: string | null };
  }>;
};

export type SubjectsForUserGradeQueryVariables = Exact<{ [key: string]: never }>;

export type SubjectsForUserGradeQuery = {
  subjectsForUserGrade: Array<{
    id: string;
    name: string;
    description: string | null;
    language: string | null;
    chapters: Array<{ id: string }>;
  }>;
};

export type QuizTypesQueryVariables = Exact<{ [key: string]: never }>;

export type QuizTypesQuery = {
  quizTypes: Array<{
    id: string;
    name: string;
    slug: string;
    question_count: number;
    is_default: boolean;
  }>;
};

export type LessonsForSubjectQueryVariables = Exact<{
  subjectId: string;
}>;

export type LessonsForSubjectQuery = {
  lessonsForSubject: Array<{
    id: string;
    name: string;
    description: string | null;
    lessons: Array<{ id: string; name: string; description: string | null; isLocked: boolean }>;
  }>;
};

export type StartQuizMutationVariables = Exact<{
  subjectId: string;
  lessonIds: Array<string> | string;
  quizTypeId?: string | null | undefined;
}>;

export type StartQuizMutation = { startQuiz: { id: string } };

export type QuizQueryVariables = Exact<{
  quizId: string;
}>;

export type QuizQuery = {
  quiz: {
    id: string;
    name: string;
    isCompleted: boolean;
    score: number | null;
    subject: { id: string; name: string; language: string | null } | null;
    questions: Array<{
      id: string;
      question: string;
      type: string;
      answers: Array<string>;
      questionNumber: number;
      explanation: string | null;
      difficulty: number;
    }>;
  };
};

export type SubmitQuizAnswersMutationVariables = Exact<{
  quizId: string;
  answers: Array<QuestionAnswerInput> | QuestionAnswerInput;
}>;

export type SubmitQuizAnswersMutation = {
  submitQuizAnswers: { score: number; totalQuestions: number; isPassed: boolean };
};

export type QuizResultsQueryVariables = Exact<{
  quizId: string;
}>;

export type QuizResultsQuery = {
  quizResults: {
    score: number;
    totalQuestions: number;
    xp: number;
    isPassed: boolean;
    isPublished: boolean;
    quiz: {
      id: string;
      name: string;
      subject: { id: string; name: string; language: string | null } | null;
      lessons: Array<{ id: string; name: string; chapter: { name: string } | null }>;
    };
    userAnswers: Array<{
      selected_answer: string | null;
      is_correct: boolean;
      score: number | null;
      explanation: string | null;
      question: {
        id: string;
        question: string;
        type: string;
        answer_1: string;
        explanation: string | null;
      };
      descriptive_feedback: { coverage_percentage: number; score_out_of_10: number } | null;
    }>;
  };
};

export type QuizReviewQueryVariables = Exact<{
  quizId: string;
}>;

export type QuizReviewQuery = {
  quizResults: {
    isPublished: boolean;
    quiz: {
      id: string;
      name: string;
      subject: { id: string; name: string; language: string | null } | null;
    };
    userAnswers: Array<{
      selected_answer: string | null;
      is_correct: boolean;
      score: number | null;
      explanation: string | null;
      question: {
        id: string;
        question: string;
        type: string;
        answer_1: string;
        answer_2: string | null;
        answer_3: string | null;
        answer_4: string | null;
        explanation: string | null;
      };
      descriptive_feedback: {
        coverage_percentage: number;
        score_out_of_10: number;
        covered_concepts: Array<string>;
        partially_covered: Array<string>;
        missing_concepts: Array<string>;
        contradictions: Array<string>;
        feedback: string | null;
      } | null;
    }>;
  };
};

export type PublishQuizToFeedMutationVariables = Exact<{
  quizId: string;
}>;

export type PublishQuizToFeedMutation = {
  publishQuizToFeed: { success: boolean; message: string | null };
};

export type SocialTimelineQueryVariables = Exact<{ [key: string]: never }>;

export type SocialTimelineQuery = {
  socialTimeline: Array<{
    id: string;
    type: string;
    createdAt: string;
    likes: number;
    comments: number;
    isLiked: boolean;
    user: {
      id: string;
      name: string;
      grade: { id: string; name: string };
      selectedAvatar: { url: string } | null;
    };
    quizData: {
      quizUserId: string;
      score: number;
      totalQuestions: number;
      isPassed: boolean;
      quiz: { id: string; name: string; type: string; subject: { id: string; name: string } };
    } | null;
    connectedUser: {
      id: string;
      name: string;
      grade: { id: string; name: string };
      selectedAvatar: { url: string } | null;
    } | null;
    rankData: {
      previousRank: number | null;
      newRank: number;
      isOverall: boolean;
      subject: { id: string; name: string } | null;
    } | null;
  }>;
};

export type SearchStudentsQueryVariables = Exact<{
  query: string;
}>;

export type SearchStudentsQuery = {
  searchStudents: Array<{
    id: string;
    name: string;
    mobile: string;
    totalQuizzes: number;
    avgScore: number;
    isFollowing: boolean;
    grade: { id: string; name: string };
    selectedAvatar: { url: string } | null;
  }>;
};

export type MyFollowersQueryVariables = Exact<{ [key: string]: never }>;

export type MyFollowersQuery = {
  myFollowers: Array<{
    id: string;
    name: string;
    mobile: string;
    totalQuizzes: number;
    avgScore: number;
    isFollowing: boolean;
    grade: { id: string; name: string };
    selectedAvatar: { url: string } | null;
  }>;
};

export type MyFollowingQueryVariables = Exact<{ [key: string]: never }>;

export type MyFollowingQuery = {
  myFollowing: Array<{
    id: string;
    name: string;
    mobile: string;
    totalQuizzes: number;
    avgScore: number;
    isFollowing: boolean;
    grade: { id: string; name: string };
    selectedAvatar: { url: string } | null;
  }>;
};

export type StudentProfileQueryVariables = Exact<{
  userId: string;
}>;

export type StudentProfileQuery = {
  studentProfile: {
    id: string;
    name: string;
    gender: string | null;
    totalQuizzes: number;
    avgScore: number;
    xp: number;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isFollower: boolean;
    createdAt: string;
    grade: { id: string; name: string } | null;
    educationalSystem: { id: string; name: string } | null;
    selectedAvatar: { url: string } | null;
  };
};

export type PeopleYouMayKnowQueryVariables = Exact<{
  limit?: number | null | undefined;
}>;

export type PeopleYouMayKnowQuery = {
  peopleYouMayKnow: {
    canShow: boolean;
    suggestions: Array<{
      id: string;
      name: string;
      suggestionReason: SuggestionReason;
      school: { id: string; name: string } | null;
      grade: { id: string; name: string } | null;
    }>;
  };
};

export type FollowUserMutationVariables = Exact<{
  userId: string;
}>;

export type FollowUserMutation = {
  followUser: { success: boolean; isFollowing: boolean; message: string };
};

export type LikeActivityMutationVariables = Exact<{
  quizUserId?: string | null | undefined;
  newsFeedId?: string | null | undefined;
}>;

export type LikeActivityMutation = {
  likeActivity: { success: boolean; isLiked: boolean; likeCount: number; message: string };
};

export const GetGradesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetGrades' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'grades' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetGradesQuery, GetGradesQueryVariables>;
export const DeleteAccountDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteAccount' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteAccount' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteAccountMutation, DeleteAccountMutationVariables>;
export const ForgotPasswordDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ForgotPassword' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'forgotPassword' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'email' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ForgotPasswordMutation, ForgotPasswordMutationVariables>;
export const UpdatePasswordDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdatePassword' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdatePasswordInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatePassword' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdatePasswordMutation, UpdatePasswordMutationVariables>;
export const SendMobileOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendMobileOtp' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mobile' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'country_code' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sendMobileOtp' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mobile' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mobile' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'country_code' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'country_code' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expires_in' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SendMobileOtpMutation, SendMobileOtpMutationVariables>;
export const VerifyMobileOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'VerifyMobileOtp' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'otp' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'verifyMobileOtp' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'otp' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'otp' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'country_code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile_verified_at' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'gender' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'school_name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'parent_mobile' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'grade_id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'grade' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'educational_system_id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'educational_system' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'governorate_id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'governorate' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name_ar' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name_en' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'city_id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'city' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name_ar' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name_en' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_subscribed' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<VerifyMobileOtpMutation, VerifyMobileOtpMutationVariables>;
export const GetBadgesScreenDataDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetBadgesScreenData' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'badgeCategories' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'nameAr' } },
                { kind: 'Field', name: { kind: 'Name', value: 'nameEn' } },
                { kind: 'Field', name: { kind: 'Name', value: 'icon' } },
                { kind: 'Field', name: { kind: 'Name', value: 'color' } },
                { kind: 'Field', name: { kind: 'Name', value: 'displayOrder' } },
                { kind: 'Field', name: { kind: 'Name', value: 'badgeCount' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'allBadges' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'nameAr' } },
                { kind: 'Field', name: { kind: 'Name', value: 'nameEn' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'descriptionAr' } },
                { kind: 'Field', name: { kind: 'Name', value: 'descriptionEn' } },
                { kind: 'Field', name: { kind: 'Name', value: 'logoUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'awardedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'rulesPreview' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'category' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetBadgesScreenDataQuery, GetBadgesScreenDataQueryVariables>;
export const StudyScheduleDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'StudySchedule' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'studySchedule' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'subject' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'dayOfWeek' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lessonGoal' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quizGoal' } },
                { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StudyScheduleQuery, StudyScheduleQueryVariables>;
export const TodayScheduleDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'TodaySchedule' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'todaySchedule' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'date' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dayOfWeek' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'schedule' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'subject' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'dayOfWeek' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lessonGoal' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quizGoal' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lessonsCompleted' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quizzesCompleted' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'completionPercentage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isComplete' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<TodayScheduleQuery, TodayScheduleQueryVariables>;
export const SaveStudyScheduleDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SaveStudySchedule' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'entries' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'StudyScheduleInput' } },
              },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'saveStudySchedule' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'entries' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'entries' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'subject' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'dayOfWeek' } },
                { kind: 'Field', name: { kind: 'Name', value: 'dayName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'lessonGoal' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quizGoal' } },
                { kind: 'Field', name: { kind: 'Name', value: 'notes' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SaveStudyScheduleMutation, SaveStudyScheduleMutationVariables>;
export const LeaderboardDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Leaderboard' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'subjectId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'filter' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'leaderboard' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subjectId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'subjectId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filter' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'filter' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'entries' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'grade' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalQuizzes' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avgScore' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'xp' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isFollowing' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'rank' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'selectedAvatar' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'userEntry' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'grade' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalQuizzes' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avgScore' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'xp' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isFollowing' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'rank' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'selectedAvatar' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<LeaderboardQuery, LeaderboardQueryVariables>;
export const StudySubjectsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'StudySubjects' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subjectsForUserGrade' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'language' } },
                { kind: 'Field', name: { kind: 'Name', value: 'study_progress' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quiz_progress' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'chapters' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StudySubjectsQuery, StudySubjectsQueryVariables>;
export const StudyChaptersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'StudyChapters' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'subjectId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lessonsForSubject' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subjectId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'subjectId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lessons' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'summary' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'points' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'videoUrl' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'myInteraction' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lessonPoints' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'order' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'is_viewed' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'isLocked' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StudyChaptersQuery, StudyChaptersQueryVariables>;
export const MySavedPointsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MySavedPoints' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'mySavedPoints' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'is_bookmarked' } },
                { kind: 'Field', name: { kind: 'Name', value: 'note_content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'created_at' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updated_at' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lesson' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'summary' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'points' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'videoUrl' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'myInteraction' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lessonPoints' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'order' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'is_viewed' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'chapter' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lessonPoint' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'order' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MySavedPointsQuery, MySavedPointsQueryVariables>;
export const LessonDodProgressDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'LessonDODProgress' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lessonDODProgress' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'lessonId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'keyPointsViewed' } },
                { kind: 'Field', name: { kind: 'Name', value: 'keyPointsTotal' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quizzesPassed' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quizzesRequired' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalProgress' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isComplete' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<LessonDodProgressQuery, LessonDodProgressQueryVariables>;
export const RecordKeyPointViewDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RecordKeyPointView' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonPointId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'recordKeyPointView' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonPointId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonPointId' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RecordKeyPointViewMutation, RecordKeyPointViewMutationVariables>;
export const ToggleLessonInteractionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ToggleLessonInteraction' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'toggleLessonInteraction' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'type' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'interactionType' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ToggleLessonInteractionMutation,
  ToggleLessonInteractionMutationVariables
>;
export const ToggleSavedPointBookmarkDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ToggleSavedPointBookmark' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonPointId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'toggleSavedPointBookmark' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonPointId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonPointId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'savedPoint' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_bookmarked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'note_content' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lessonPoint' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ToggleSavedPointBookmarkMutation,
  ToggleSavedPointBookmarkMutationVariables
>;
export const SavePointNoteDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SavePointNote' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonPointId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'noteContent' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'savePointNote' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonPointId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonPointId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'noteContent' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'noteContent' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'savedPoint' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_bookmarked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'note_content' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'created_at' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updated_at' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lesson' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'chapter' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lessonPoint' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'order' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SavePointNoteMutation, SavePointNoteMutationVariables>;
export const DeletePointNoteDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeletePointNote' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonPointId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deletePointNote' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonPointId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonPointId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'savedPoint' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_bookmarked' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'note_content' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lessonPoint' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeletePointNoteMutation, DeletePointNoteMutationVariables>;
export const UserNotificationsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UserNotifications' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'per_page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'userNotifications' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'page' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'per_page' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'per_page' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'body' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'channel' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'event_slug' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'action_url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_read' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'read_at' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'created_at' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                { kind: 'Field', name: { kind: 'Name', value: 'unread_count' } },
                { kind: 'Field', name: { kind: 'Name', value: 'has_more' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserNotificationsQuery, UserNotificationsQueryVariables>;
export const MarkNotificationReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'MarkNotificationRead' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'markNotificationRead' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'read_at' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MarkNotificationReadMutation, MarkNotificationReadMutationVariables>;
export const MarkAllNotificationsReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'MarkAllNotificationsRead' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'markAllNotificationsRead' } }],
      },
    },
  ],
} as unknown as DocumentNode<
  MarkAllNotificationsReadMutation,
  MarkAllNotificationsReadMutationVariables
>;
export const ParentNotificationsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ParentNotifications' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'per_page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'parentNotifications' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'page' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'per_page' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'per_page' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'body' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'channel' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'event_slug' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'action_url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_read' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'read_at' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'created_at' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                { kind: 'Field', name: { kind: 'Name', value: 'unread_count' } },
                { kind: 'Field', name: { kind: 'Name', value: 'has_more' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ParentNotificationsQuery, ParentNotificationsQueryVariables>;
export const ParentMarkNotificationReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentMarkNotificationRead' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'parentMarkNotificationRead' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'read_at' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ParentMarkNotificationReadMutation,
  ParentMarkNotificationReadMutationVariables
>;
export const ParentMarkAllNotificationsReadDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentMarkAllNotificationsRead' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'parentMarkAllNotificationsRead' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ParentMarkAllNotificationsReadMutation,
  ParentMarkAllNotificationsReadMutationVariables
>;
export const GetNotificationPreferencesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetNotificationPreferences' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'notificationPreferences' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'app_notifications_enabled' } },
                { kind: 'Field', name: { kind: 'Name', value: 'social_notifications_enabled' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetNotificationPreferencesQuery,
  GetNotificationPreferencesQueryVariables
>;
export const UpdateNotificationPreferencesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateNotificationPreferences' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateNotificationPreferencesInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateNotificationPreferences' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'app_notifications_enabled' } },
                { kind: 'Field', name: { kind: 'Name', value: 'social_notifications_enabled' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdateNotificationPreferencesMutation,
  UpdateNotificationPreferencesMutationVariables
>;
export const GetParentNotificationPreferencesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetParentNotificationPreferences' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'parentNotificationPreferences' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'app_notifications_enabled' } },
                { kind: 'Field', name: { kind: 'Name', value: 'social_notifications_enabled' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetParentNotificationPreferencesQuery,
  GetParentNotificationPreferencesQueryVariables
>;
export const ParentUpdateNotificationPreferencesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentUpdateNotificationPreferences' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateNotificationPreferencesInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'parentUpdateNotificationPreferences' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'app_notifications_enabled' } },
                { kind: 'Field', name: { kind: 'Name', value: 'social_notifications_enabled' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ParentUpdateNotificationPreferencesMutation,
  ParentUpdateNotificationPreferencesMutationVariables
>;
export const ParentLinkRequestsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ParentLinkRequests' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'parentLinkRequests' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'initiated_by' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'parent' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'created_at' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ParentLinkRequestsQuery, ParentLinkRequestsQueryVariables>;
export const SendParentLinkRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendParentLinkRequest' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'mobile' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sendParentLinkRequest' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'parent_mobile' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mobile' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'initiated_by' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'parent' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SendParentLinkRequestMutation, SendParentLinkRequestMutationVariables>;
export const RespondToParentLinkDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RespondToParentLink' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'requestId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'action' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'respondToParentLink' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'request_id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'requestId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'action' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'action' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RespondToParentLinkMutation, RespondToParentLinkMutationVariables>;
export const CancelParentLinkRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CancelParentLinkRequest' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'requestId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'cancelParentLinkRequest' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'request_id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'requestId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  CancelParentLinkRequestMutation,
  CancelParentLinkRequestMutationVariables
>;
export const MyLinkedChildrenDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyLinkedChildren' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'linkedChildren' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'selectedAvatar' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'grade' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'educational_system' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MyLinkedChildrenQuery, MyLinkedChildrenQueryVariables>;
export const ParentChildRequestsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ParentChildRequests' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'parentChildRequests' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'initiated_by' } },
                { kind: 'Field', name: { kind: 'Name', value: 'created_at' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'child' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'school_name' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ParentChildRequestsQuery, ParentChildRequestsQueryVariables>;
export const GetChildDashboardDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetChildDashboard' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'childId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'childDashboard' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'child_id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'childId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'child' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'selectedAvatar' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                        },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'quizzes_solved' } },
                { kind: 'Field', name: { kind: 'Name', value: 'average_score' } },
                { kind: 'Field', name: { kind: 'Name', value: 'started_subjects_count' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'subject_performance' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'subject_name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quiz_count' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avg_score' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'recent_activity' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'subject_name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'total_questions' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_passed' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'completed_at' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetChildDashboardQuery, GetChildDashboardQueryVariables>;
export const UserQuizHistoryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'UserQuizHistory' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'userQuizHistory' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'subject' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'language' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalQuestions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'completedAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isPassed' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UserQuizHistoryQuery, UserQuizHistoryQueryVariables>;
export const SubjectsForUserGradeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SubjectsForUserGrade' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subjectsForUserGrade' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'language' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'chapters' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>;
export const QuizTypesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'QuizTypes' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'quizTypes' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'slug' } },
                { kind: 'Field', name: { kind: 'Name', value: 'question_count' } },
                { kind: 'Field', name: { kind: 'Name', value: 'is_default' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<QuizTypesQuery, QuizTypesQueryVariables>;
export const LessonsForSubjectDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'LessonsForSubject' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'subjectId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'lessonsForSubject' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subjectId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'subjectId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lessons' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isLocked' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<LessonsForSubjectQuery, LessonsForSubjectQueryVariables>;
export const StartQuizDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'StartQuiz' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'subjectId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'lessonIds' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
              },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'quizTypeId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'startQuiz' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subjectId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'subjectId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonIds' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonIds' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'quizTypeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'quizTypeId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StartQuizMutation, StartQuizMutationVariables>;
export const QuizDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Quiz' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'quiz' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'quizId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'subject' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'language' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'questions' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'question' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'answers' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'questionNumber' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'difficulty' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'isCompleted' } },
                { kind: 'Field', name: { kind: 'Name', value: 'score' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<QuizQuery, QuizQueryVariables>;
export const SubmitQuizAnswersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SubmitQuizAnswers' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'answers' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NonNullType',
                type: { kind: 'NamedType', name: { kind: 'Name', value: 'QuestionAnswerInput' } },
              },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'submitQuizAnswers' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'quizId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'answers' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'answers' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalQuestions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isPassed' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SubmitQuizAnswersMutation, SubmitQuizAnswersMutationVariables>;
export const QuizResultsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'QuizResults' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'quizResults' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'quizId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'quiz' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'subject' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'language' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lessons' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'chapter' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalQuestions' } },
                { kind: 'Field', name: { kind: 'Name', value: 'xp' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'userAnswers' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'question' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'question' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'answer_1' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'selected_answer' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_correct' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'descriptive_feedback' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'coverage_percentage' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'score_out_of_10' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'isPassed' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isPublished' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<QuizResultsQuery, QuizResultsQueryVariables>;
export const QuizReviewDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'QuizReview' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'quizResults' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'quizId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'quiz' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'subject' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'language' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'isPublished' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'userAnswers' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'question' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'question' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'answer_1' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'answer_2' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'answer_3' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'answer_4' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'selected_answer' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_correct' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'descriptive_feedback' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'coverage_percentage' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'score_out_of_10' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'covered_concepts' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'partially_covered' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'missing_concepts' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'contradictions' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'feedback' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<QuizReviewQuery, QuizReviewQueryVariables>;
export const PublishQuizToFeedDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'PublishQuizToFeed' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'publishQuizToFeed' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'quizId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'quizId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PublishQuizToFeedMutation, PublishQuizToFeedMutationVariables>;
export const SocialTimelineDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SocialTimeline' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'socialTimeline' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'user' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'grade' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'selectedAvatar' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                        },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'quizData' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'quizUserId' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'quiz' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'subject' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                ],
                              },
                            },
                            { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'totalQuestions' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isPassed' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'connectedUser' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'grade' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'selectedAvatar' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'rankData' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'previousRank' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'newRank' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'subject' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'isOverall' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'likes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'comments' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isLiked' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SocialTimelineQuery, SocialTimelineQueryVariables>;
export const SearchStudentsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SearchStudents' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'query' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'searchStudents' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'query' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'query' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'grade' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalQuizzes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avgScore' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isFollowing' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'selectedAvatar' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SearchStudentsQuery, SearchStudentsQueryVariables>;
export const MyFollowersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyFollowers' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myFollowers' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'grade' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalQuizzes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avgScore' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isFollowing' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'selectedAvatar' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MyFollowersQuery, MyFollowersQueryVariables>;
export const MyFollowingDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'MyFollowing' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myFollowing' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'grade' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalQuizzes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avgScore' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isFollowing' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'selectedAvatar' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MyFollowingQuery, MyFollowingQueryVariables>;
export const StudentProfileDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'StudentProfile' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'studentProfile' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gender' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'grade' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'educationalSystem' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'selectedAvatar' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'url' } }],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'totalQuizzes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avgScore' } },
                { kind: 'Field', name: { kind: 'Name', value: 'xp' } },
                { kind: 'Field', name: { kind: 'Name', value: 'followersCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'followingCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isFollowing' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isFollower' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StudentProfileQuery, StudentProfileQueryVariables>;
export const PeopleYouMayKnowDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PeopleYouMayKnow' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'peopleYouMayKnow' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'canShow' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'suggestions' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'suggestionReason' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'school' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'grade' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PeopleYouMayKnowQuery, PeopleYouMayKnowQueryVariables>;
export const FollowUserDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'FollowUser' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'followUser' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'userId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'userId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isFollowing' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<FollowUserMutation, FollowUserMutationVariables>;
export const LikeActivityDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'LikeActivity' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'quizUserId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'newsFeedId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'likeActivity' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'quizUserId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'quizUserId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'newsFeedId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'newsFeedId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'success' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isLiked' } },
                { kind: 'Field', name: { kind: 'Name', value: 'likeCount' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<LikeActivityMutation, LikeActivityMutationVariables>;
