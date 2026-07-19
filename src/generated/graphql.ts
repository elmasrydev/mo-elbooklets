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

export type ToggleSavedPointBookmarkMutationVariables = Exact<{
  lessonId: string;
  lessonPointId: string;
}>;

export type ToggleSavedPointBookmarkMutation = {
  toggleSavedPointBookmark: {
    success: boolean;
    message: string | null;
    savedPoint: { id: string; is_bookmarked: boolean; note_content: string | null } | null;
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
    savedPoint: { id: string; is_bookmarked: boolean; note_content: string | null } | null;
  };
};

export type DeletePointNoteMutationVariables = Exact<{
  lessonPointId: string;
}>;

export type DeletePointNoteMutation = {
  deletePointNote: {
    success: boolean;
    message: string | null;
    savedPoint: { id: string; is_bookmarked: boolean; note_content: string | null } | null;
  };
};

export type RemoveSavedPointMutationVariables = Exact<{
  lessonPointId: string;
}>;

export type RemoveSavedPointMutation = {
  removeSavedPoint: { success: boolean; message: string | null };
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
    lesson: { id: string; name: string; chapter: { id: string; name: string } | null };
    lessonPoint: { id: string; title: string; explanation: string | null; order: number };
  }>;
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
    subject: { id: string; name: string };
  }>;
};

export type SubjectsForUserGradeQueryVariables = Exact<{ [key: string]: never }>;

export type SubjectsForUserGradeQuery = {
  subjectsForUserGrade: Array<{ id: string; name: string; description: string | null }>;
};

export type StartQuizMutationVariables = Exact<{
  subjectId: string;
  lessonIds: Array<string> | string;
}>;

export type StartQuizMutation = {
  startQuiz: {
    id: string;
    name: string;
    questions: Array<{
      id: string;
      question: string;
      answers: Array<string>;
      questionNumber: number;
    }>;
  };
};

export type SubmitQuizAnswersMutationVariables = Exact<{
  quizId: string;
  answers: Array<QuestionAnswerInput> | QuestionAnswerInput;
}>;

export type SubmitQuizAnswersMutation = {
  submitQuizAnswers: {
    score: number;
    totalQuestions: number;
    isPassed: boolean;
    quiz: { id: string; name: string };
  };
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
export const RemoveSavedPointDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveSavedPoint' },
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
            name: { kind: 'Name', value: 'removeSavedPoint' },
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RemoveSavedPointMutation, RemoveSavedPointMutationVariables>;
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
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SubjectsForUserGradeQuery, SubjectsForUserGradeQueryVariables>;
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
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'questions' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'question' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'answers' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'questionNumber' } },
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
} as unknown as DocumentNode<StartQuizMutation, StartQuizMutationVariables>;
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'quiz' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
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
