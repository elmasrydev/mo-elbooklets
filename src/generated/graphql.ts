/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** Login input */
export type LoginInput = {
  mobile: string;
  password: string;
};

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

/** Register input */
export type RegisterInput = {
  avatar_id?: string | null | undefined;
  country_code?: string | null | undefined;
  educational_system_id?: string | null | undefined;
  email?: string | null | undefined;
  gender?: string | null | undefined;
  grade_id: string;
  mobile: string;
  name: string;
  parent_country_code?: string | null | undefined;
  parent_country_code_2?: string | null | undefined;
  parent_mobile?: string | null | undefined;
  parent_mobile_2?: string | null | undefined;
  password: string;
  promo_code?: string | null | undefined;
  school_name?: string | null | undefined;
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

/** Update profile input for progressive field collection */
export type UpdateProfileInput = {
  avatar_id?: string | null | undefined;
  city?: string | null | undefined;
  city_id?: string | null | undefined;
  educational_system_id?: string | null | undefined;
  email?: string | null | undefined;
  gender?: string | null | undefined;
  governorate_id?: string | null | undefined;
  language?: string | null | undefined;
  name?: string | null | undefined;
  parent_country_code?: string | null | undefined;
  parent_country_code_2?: string | null | undefined;
  parent_mobile?: string | null | undefined;
  parent_mobile_2?: string | null | undefined;
  school_id?: string | null | undefined;
  school_name?: string | null | undefined;
};

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;

export type LoginMutation = {
  login: {
    access_token: string;
    user: {
      id: string;
      name: string;
      email: string | null;
      mobile: string;
      country_code: string | null;
      mobile_verified_at: string | null;
      grade_id: string | null;
      educational_system_id: string | null;
      is_subscribed: boolean;
      grade: { id: string; name: string } | null;
      educational_system: { id: string; name: string } | null;
    };
  };
};

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;

export type RegisterMutation = {
  register: {
    access_token: string;
    user: {
      id: string;
      name: string;
      email: string | null;
      mobile: string;
      country_code: string | null;
      mobile_verified_at: string | null;
      grade_id: string | null;
      educational_system_id: string | null;
      is_subscribed: boolean;
      grade: { id: string; name: string } | null;
      educational_system: { id: string; name: string } | null;
    };
  };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  me: {
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
    selectedAvatar: { id: string; name: string; url: string; gender: string | null } | null;
  } | null;
};

export type ParentLoginMutationVariables = Exact<{
  mobile: string;
  password: string;
}>;

export type ParentLoginMutation = {
  parentLogin: {
    access_token: string;
    parent: {
      id: string;
      name: string | null;
      mobile: string;
      email: string | null;
      country_code: string | null;
      mobile_verified_at: string | null;
    };
  };
};

export type ParentRegisterMutationVariables = Exact<{
  name: string;
  mobile: string;
  email: string;
  password: string;
}>;

export type ParentRegisterMutation = {
  parentRegister: {
    access_token: string;
    parent: {
      id: string;
      name: string | null;
      mobile: string;
      email: string | null;
      country_code: string | null;
      mobile_verified_at: string | null;
    };
  };
};

export type ParentMeQueryVariables = Exact<{ [key: string]: never }>;

export type ParentMeQuery = {
  parentMe: {
    id: string;
    name: string | null;
    mobile: string;
    email: string | null;
    country_code: string | null;
    mobile_verified_at: string | null;
  };
};

export type ParentForgotPasswordMutationVariables = Exact<{
  email: string;
}>;

export type ParentForgotPasswordMutation = {
  parentForgotPassword: { success: boolean; message: string | null };
};

export type CheckMobileAvailabilityMutationVariables = Exact<{
  mobile: string;
  type?: string | null | undefined;
}>;

export type CheckMobileAvailabilityMutation = {
  checkMobileAvailability: { available: boolean; message: string };
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

export type SendParentMobileOtpMutationVariables = Exact<{
  mobile: string;
  country_code?: string | null | undefined;
}>;

export type SendParentMobileOtpMutation = {
  sendParentMobileOtp: { success: boolean; message: string; expires_in: number };
};

export type VerifyParentMobileOtpMutationVariables = Exact<{
  otp: string;
}>;

export type VerifyParentMobileOtpMutation = {
  verifyParentMobileOtp: {
    success: boolean;
    message: string;
    parent: {
      id: string;
      name: string | null;
      mobile: string;
      email: string | null;
      country_code: string | null;
      mobile_verified_at: string | null;
    } | null;
  };
};

export type SendPasswordResetOtpMutationVariables = Exact<{
  mobile: string;
  country_code?: string | null | undefined;
}>;

export type SendPasswordResetOtpMutation = {
  sendPasswordResetOtp: { success: boolean; message: string; expires_in: number };
};

export type ResetPasswordWithOtpMutationVariables = Exact<{
  mobile: string;
  country_code?: string | null | undefined;
  otp: string;
  password: string;
  password_confirmation: string;
}>;

export type ResetPasswordWithOtpMutation = {
  resetPasswordWithOtp: { success: boolean; message: string | null };
};

export type SendParentPasswordResetOtpMutationVariables = Exact<{
  mobile: string;
  country_code?: string | null | undefined;
}>;

export type SendParentPasswordResetOtpMutation = {
  sendParentPasswordResetOtp: { success: boolean; message: string; expires_in: number };
};

export type ResetParentPasswordWithOtpMutationVariables = Exact<{
  mobile: string;
  country_code?: string | null | undefined;
  otp: string;
  password: string;
  password_confirmation: string;
}>;

export type ResetParentPasswordWithOtpMutation = {
  resetParentPasswordWithOtp: { success: boolean; message: string | null };
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

export type HomeDataQueryVariables = Exact<{ [key: string]: never }>;

export type HomeDataQuery = {
  activities: {
    total_quizzes: number;
    avg_score: number;
    performance_status: string;
    performance_trend: string;
    streak: number;
    activities: Array<{
      id: string;
      name: string;
      score: number;
      totalQuestions: number;
      completedAt: string;
      isPassed: boolean;
      subject: { id: string; name: string };
    }>;
    weekly_performance: Array<{ week: string; score: number }>;
  };
  wheelOfSuccess: {
    overallProgress: number;
    arms: Array<{ id: string; name: string; progress: number; color: string; type: string }>;
  };
};

export type HomeLeaderboardQueryVariables = Exact<{
  limit?: number | null | undefined;
}>;

export type HomeLeaderboardQuery = {
  leaderboard: {
    entries: Array<{
      id: string;
      name: string;
      xp: number;
      rank: number;
      selectedAvatar: { url: string } | null;
    }>;
    userEntry: {
      id: string;
      name: string;
      xp: number;
      rank: number;
      selectedAvatar: { url: string } | null;
    } | null;
  };
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

export type RegisterDeviceTokenMutationVariables = Exact<{
  token: string;
  platform: string;
}>;

export type RegisterDeviceTokenMutation = { registerDeviceToken: boolean };

export type ParentRegisterDeviceTokenMutationVariables = Exact<{
  token: string;
  platform: string;
}>;

export type ParentRegisterDeviceTokenMutation = { parentRegisterDeviceToken: boolean };

export type UnregisterDeviceTokenMutationVariables = Exact<{
  token: string;
}>;

export type UnregisterDeviceTokenMutation = { unregisterDeviceToken: boolean };

export type ParentUnregisterDeviceTokenMutationVariables = Exact<{
  token: string;
}>;

export type ParentUnregisterDeviceTokenMutation = { parentUnregisterDeviceToken: boolean };

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

export type ParentSendLinkRequestMutationVariables = Exact<{
  mobile: string;
}>;

export type ParentSendLinkRequestMutation = {
  parentSendLinkRequest: { id: string; status: string };
};

export type ParentRespondToLinkMutationVariables = Exact<{
  requestId: string;
  action: string;
}>;

export type ParentRespondToLinkMutation = { parentRespondToLink: { id: string; status: string } };

export type ParentCancelLinkRequestMutationVariables = Exact<{
  requestId: string;
}>;

export type ParentCancelLinkRequestMutation = {
  parentCancelLinkRequest: { success: boolean; message: string | null };
};

export type SubscriptionPlansQueryVariables = Exact<{ [key: string]: never }>;

export type SubscriptionPlansQuery = {
  subscriptionPlans: {
    currency: string;
    hasFullAccess: boolean;
    hasPendingOrder: boolean;
    subscribedSubjectIds: Array<string>;
    plans: Array<{
      id: string;
      name: string;
      description: string | null;
      nameAr: string | null;
      nameEn: string | null;
      descriptionAr: string | null;
      descriptionEn: string | null;
      type: string;
      requiresSubjectSelection: boolean;
      cost: number;
      currency: string;
      durationDays: number | null;
      endsAt: string | null;
      lessonLimit: number | null;
      quizLimitPerDay: number | null;
      allowedSubjectsCount: number | null;
    }>;
    selectableSubjects: Array<{ id: string; name: string }>;
  };
};

export type StartPaymobCheckoutMutationVariables = Exact<{
  planId: string;
  subjectIds?: Array<string> | string | null | undefined;
  promoCode?: string | null | undefined;
}>;

export type StartPaymobCheckoutMutation = {
  createPaymobCheckout: {
    subscriptionId: string | null;
    status: string;
    checkoutUrl: string | null;
    reference: string | null;
  };
};

export type PaymentIntentStatusQueryVariables = Exact<{
  reference: string;
}>;

export type PaymentIntentStatusQuery = {
  paymentIntentStatus: {
    reference: string;
    status: string;
    failureReason: string | null;
    subscriptionId: string | null;
  } | null;
};

export type ProfileCompletenessQueryVariables = Exact<{ [key: string]: never }>;

export type ProfileCompletenessQuery = {
  profileCompleteness: {
    isComplete: boolean;
    missingFields: Array<string>;
    percentage: number;
    needsGender: boolean;
    needsSchool: boolean;
    needsParentMobile: boolean;
    needsEmail: boolean;
    needsGovernorate: boolean;
    needsCity: boolean;
  };
};

export type ProfileXpQueryVariables = Exact<{
  limit?: number | null | undefined;
}>;

export type ProfileXpQuery = { leaderboard: { userEntry: { xp: number } | null } };

export type FollowCountsQueryVariables = Exact<{ [key: string]: never }>;

export type FollowCountsQuery = {
  myFollowing: Array<{ id: string }>;
  myFollowers: Array<{ id: string }>;
};

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;

export type UpdateProfileMutation = {
  updateProfile: {
    id: string;
    name: string;
    email: string | null;
    gender: string | null;
    school_name: string | null;
    parent_mobile: string | null;
    mobile_verified_at: string | null;
    governorate_id: string | null;
    city_id: string | null;
    governorate: { id: string; name_ar: string; name_en: string } | null;
    city: { id: string; name_ar: string; name_en: string } | null;
    educational_system: { id: string; name: string } | null;
    selectedAvatar: { id: string; name: string; url: string; gender: string | null } | null;
  };
};

export type AvatarsQueryVariables = Exact<{
  gender?: string | null | undefined;
  first: number;
  page?: number | null | undefined;
}>;

export type AvatarsQuery = {
  avatars: {
    data: Array<{ id: string; name: string; url: string; gender: string | null }>;
    paginatorInfo: { currentPage: number; lastPage: number };
  };
};

export type GetEduSystemsQueryVariables = Exact<{ [key: string]: never }>;

export type GetEduSystemsQuery = { educationalSystems: Array<{ id: string; name: string }> };

export type GetGovernoratesQueryVariables = Exact<{ [key: string]: never }>;

export type GetGovernoratesQuery = {
  governorates: Array<{ id: string; name_ar: string; name_en: string }>;
};

export type SearchCitiesQueryVariables = Exact<{
  governorate_id?: string | null | undefined;
  query: string;
}>;

export type SearchCitiesQuery = {
  searchCities: Array<{ id: string; name_ar: string; name_en: string; governorate_id: string }>;
};

export type SearchSchoolsQueryVariables = Exact<{
  search: string;
}>;

export type SearchSchoolsQuery = {
  searchSchools: Array<{ id: string; name: string; name_en: string | null; is_verified: boolean }>;
};

export type AddCityMutationVariables = Exact<{
  governorate_id: string;
  name: string;
}>;

export type AddCityMutation = {
  addCity: { id: string; name_ar: string; name_en: string; governorate_id: string };
};

export type AddSchoolMutationVariables = Exact<{
  name: string;
  governorate?: string | null | undefined;
}>;

export type AddSchoolMutation = {
  addSchool: { id: string; name: string; name_en: string | null; is_verified: boolean };
};

export type GetAppConfigQueryVariables = Exact<{ [key: string]: never }>;

export type GetAppConfigQuery = { appConfig: { campaignFreeAccess: boolean } };

export type SetLanguageMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;

export type SetLanguageMutation = { updateProfile: { id: string } };

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

export type LessonQuestionTypesQueryVariables = Exact<{
  lessonIds: Array<string> | string;
}>;

export type LessonQuestionTypesQuery = {
  lessonQuestionTypes: {
    total: number;
    minSelectedTypes: number;
    types: Array<{ type: string; label: string; count: number }>;
  };
};

export type StartQuizMutationVariables = Exact<{
  subjectId: string;
  lessonIds: Array<string> | string;
  quizTypeId?: string | null | undefined;
  questionTypes?: Array<string> | string | null | undefined;
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
      difficulty: number;
      imageUrl: string | null;
      matchPairs: {
        left: Array<{ id: string; text: string }>;
        right: Array<{ id: string; text: string }>;
      } | null;
      subQuestions: Array<{
        id: string;
        questionNumber: number;
        type: string;
        question: string;
        answers: Array<string>;
        imageUrl: string | null;
      }> | null;
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
        answer_1: string | null;
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
    score: number;
    totalQuestions: number;
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
      parent_question_id: string | null;
      question: {
        id: string;
        question: string;
        type: string;
        answer_1: string | null;
        answer_2: string | null;
        answer_3: string | null;
        answer_4: string | null;
        explanation: string | null;
        imageUrl: string | null;
        matchColumns: {
          left: Array<{ id: string; text: string }>;
          right: Array<{ id: string; text: string }>;
        } | null;
        parent: { id: string; question: string } | null;
      };
      match_results: Array<{ leftId: string; rightId: string; isCorrect: boolean }> | null;
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

export type SendContactMessageMutationVariables = Exact<{
  name: string;
  email: string;
  subject: string;
  message: string;
}>;

export type SendContactMessageMutation = {
  sendContactMessage: { success: boolean; message: string | null };
};

export type QuestionReportTypesQueryVariables = Exact<{ [key: string]: never }>;

export type QuestionReportTypesQuery = { questionReportTypes: Array<{ id: string; name: string }> };

export type ReportQuestionMutationVariables = Exact<{
  questionId: string;
  reportTypeId: string;
  comment?: string | null | undefined;
}>;

export type ReportQuestionMutation = {
  reportQuestion: { success: boolean; message: string | null };
};

export const LoginDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'Login' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'LoginInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'login' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'access_token' } },
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
} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const RegisterDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'Register' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'RegisterInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'register' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'access_token' } },
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
} as unknown as DocumentNode<RegisterMutation, RegisterMutationVariables>;
export const MeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Me' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'me' },
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'selectedAvatar' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'gender' } },
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
} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const ParentLoginDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentLogin' },
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
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
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
            name: { kind: 'Name', value: 'parentLogin' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'ObjectValue',
                  fields: [
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'mobile' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'mobile' } },
                    },
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'password' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'access_token' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'parent' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'country_code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile_verified_at' } },
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
} as unknown as DocumentNode<ParentLoginMutation, ParentLoginMutationVariables>;
export const ParentRegisterDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentRegister' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
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
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
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
            name: { kind: 'Name', value: 'parentRegister' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'ObjectValue',
                  fields: [
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'name' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                    },
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'mobile' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'mobile' } },
                    },
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'email' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
                    },
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'password' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'access_token' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'parent' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'country_code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile_verified_at' } },
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
} as unknown as DocumentNode<ParentRegisterMutation, ParentRegisterMutationVariables>;
export const ParentMeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ParentMe' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'parentMe' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'country_code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mobile_verified_at' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ParentMeQuery, ParentMeQueryVariables>;
export const ParentForgotPasswordDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentForgotPassword' },
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
            name: { kind: 'Name', value: 'parentForgotPassword' },
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
} as unknown as DocumentNode<ParentForgotPasswordMutation, ParentForgotPasswordMutationVariables>;
export const CheckMobileAvailabilityDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CheckMobileAvailability' },
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
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'type' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'checkMobileAvailability' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'mobile' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mobile' } },
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
                { kind: 'Field', name: { kind: 'Name', value: 'available' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  CheckMobileAvailabilityMutation,
  CheckMobileAvailabilityMutationVariables
>;
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
export const SendParentMobileOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendParentMobileOtp' },
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
            name: { kind: 'Name', value: 'sendParentMobileOtp' },
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
} as unknown as DocumentNode<SendParentMobileOtpMutation, SendParentMobileOtpMutationVariables>;
export const VerifyParentMobileOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'VerifyParentMobileOtp' },
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
            name: { kind: 'Name', value: 'verifyParentMobileOtp' },
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
                  name: { kind: 'Name', value: 'parent' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'country_code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'mobile_verified_at' } },
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
} as unknown as DocumentNode<VerifyParentMobileOtpMutation, VerifyParentMobileOtpMutationVariables>;
export const SendPasswordResetOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendPasswordResetOtp' },
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
            name: { kind: 'Name', value: 'sendPasswordResetOtp' },
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
} as unknown as DocumentNode<SendPasswordResetOtpMutation, SendPasswordResetOtpMutationVariables>;
export const ResetPasswordWithOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ResetPasswordWithOtp' },
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
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'otp' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'password_confirmation' } },
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
            name: { kind: 'Name', value: 'resetPasswordWithOtp' },
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
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'otp' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'otp' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'password' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'password_confirmation' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'password_confirmation' } },
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
} as unknown as DocumentNode<ResetPasswordWithOtpMutation, ResetPasswordWithOtpMutationVariables>;
export const SendParentPasswordResetOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendParentPasswordResetOtp' },
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
            name: { kind: 'Name', value: 'sendParentPasswordResetOtp' },
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
} as unknown as DocumentNode<
  SendParentPasswordResetOtpMutation,
  SendParentPasswordResetOtpMutationVariables
>;
export const ResetParentPasswordWithOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ResetParentPasswordWithOtp' },
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
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'otp' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'password_confirmation' } },
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
            name: { kind: 'Name', value: 'resetParentPasswordWithOtp' },
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
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'otp' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'otp' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'password' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'password' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'password_confirmation' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'password_confirmation' } },
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
  ResetParentPasswordWithOtpMutation,
  ResetParentPasswordWithOtpMutationVariables
>;
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
export const HomeDataDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'HomeData' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'activities' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'total_quizzes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avg_score' } },
                { kind: 'Field', name: { kind: 'Name', value: 'performance_status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'performance_trend' } },
                { kind: 'Field', name: { kind: 'Name', value: 'streak' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'activities' },
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'weekly_performance' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'week' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'wheelOfSuccess' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'arms' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'progress' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'color' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'overallProgress' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<HomeDataQuery, HomeDataQueryVariables>;
export const HomeLeaderboardDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'HomeLeaderboard' },
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
            name: { kind: 'Name', value: 'leaderboard' },
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'entries' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'xp' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'xp' } },
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
} as unknown as DocumentNode<HomeLeaderboardQuery, HomeLeaderboardQueryVariables>;
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
export const RegisterDeviceTokenDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RegisterDeviceToken' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'platform' } },
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
            name: { kind: 'Name', value: 'registerDeviceToken' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'token' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'platform' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'platform' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RegisterDeviceTokenMutation, RegisterDeviceTokenMutationVariables>;
export const ParentRegisterDeviceTokenDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentRegisterDeviceToken' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'platform' } },
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
            name: { kind: 'Name', value: 'parentRegisterDeviceToken' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'token' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'platform' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'platform' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ParentRegisterDeviceTokenMutation,
  ParentRegisterDeviceTokenMutationVariables
>;
export const UnregisterDeviceTokenDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UnregisterDeviceToken' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
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
            name: { kind: 'Name', value: 'unregisterDeviceToken' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'token' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UnregisterDeviceTokenMutation, UnregisterDeviceTokenMutationVariables>;
export const ParentUnregisterDeviceTokenDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentUnregisterDeviceToken' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
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
            name: { kind: 'Name', value: 'parentUnregisterDeviceToken' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'token' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  ParentUnregisterDeviceTokenMutation,
  ParentUnregisterDeviceTokenMutationVariables
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
export const ParentSendLinkRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentSendLinkRequest' },
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
            name: { kind: 'Name', value: 'parentSendLinkRequest' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'child_mobile' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'mobile' } },
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
} as unknown as DocumentNode<ParentSendLinkRequestMutation, ParentSendLinkRequestMutationVariables>;
export const ParentRespondToLinkDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentRespondToLink' },
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
            name: { kind: 'Name', value: 'parentRespondToLink' },
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
} as unknown as DocumentNode<ParentRespondToLinkMutation, ParentRespondToLinkMutationVariables>;
export const ParentCancelLinkRequestDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ParentCancelLinkRequest' },
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
            name: { kind: 'Name', value: 'parentCancelLinkRequest' },
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
  ParentCancelLinkRequestMutation,
  ParentCancelLinkRequestMutationVariables
>;
export const SubscriptionPlansDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SubscriptionPlans' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subscriptionPlans' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
                { kind: 'Field', name: { kind: 'Name', value: 'hasFullAccess' } },
                { kind: 'Field', name: { kind: 'Name', value: 'hasPendingOrder' } },
                { kind: 'Field', name: { kind: 'Name', value: 'subscribedSubjectIds' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'plans' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'nameAr' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'nameEn' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'descriptionAr' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'descriptionEn' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'requiresSubjectSelection' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'cost' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'durationDays' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'endsAt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lessonLimit' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'quizLimitPerDay' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'allowedSubjectsCount' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'selectableSubjects' },
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
} as unknown as DocumentNode<SubscriptionPlansQuery, SubscriptionPlansQueryVariables>;
export const StartPaymobCheckoutDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'StartPaymobCheckout' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'planId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'subjectIds' } },
          type: {
            kind: 'ListType',
            type: {
              kind: 'NonNullType',
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'promoCode' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createPaymobCheckout' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'planId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'planId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subjectIds' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'subjectIds' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'promoCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'promoCode' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'subscriptionId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'checkoutUrl' } },
                { kind: 'Field', name: { kind: 'Name', value: 'reference' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StartPaymobCheckoutMutation, StartPaymobCheckoutMutationVariables>;
export const PaymentIntentStatusDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PaymentIntentStatus' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reference' } },
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
            name: { kind: 'Name', value: 'paymentIntentStatus' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reference' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reference' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'reference' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'failureReason' } },
                { kind: 'Field', name: { kind: 'Name', value: 'subscriptionId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PaymentIntentStatusQuery, PaymentIntentStatusQueryVariables>;
export const ProfileCompletenessDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ProfileCompleteness' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'profileCompleteness' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'isComplete' } },
                { kind: 'Field', name: { kind: 'Name', value: 'missingFields' } },
                { kind: 'Field', name: { kind: 'Name', value: 'percentage' } },
                { kind: 'Field', name: { kind: 'Name', value: 'needsGender' } },
                { kind: 'Field', name: { kind: 'Name', value: 'needsSchool' } },
                { kind: 'Field', name: { kind: 'Name', value: 'needsParentMobile' } },
                { kind: 'Field', name: { kind: 'Name', value: 'needsEmail' } },
                { kind: 'Field', name: { kind: 'Name', value: 'needsGovernorate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'needsCity' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ProfileCompletenessQuery, ProfileCompletenessQueryVariables>;
export const ProfileXpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'ProfileXp' },
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
            name: { kind: 'Name', value: 'leaderboard' },
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'userEntry' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'xp' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ProfileXpQuery, ProfileXpQueryVariables>;
export const FollowCountsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'FollowCounts' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myFollowing' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'myFollowers' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<FollowCountsQuery, FollowCountsQueryVariables>;
export const UpdateProfileDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateProfile' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateProfileInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateProfile' },
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
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                { kind: 'Field', name: { kind: 'Name', value: 'gender' } },
                { kind: 'Field', name: { kind: 'Name', value: 'school_name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parent_mobile' } },
                { kind: 'Field', name: { kind: 'Name', value: 'mobile_verified_at' } },
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
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'selectedAvatar' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'gender' } },
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
} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const AvatarsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Avatars' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'gender' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'avatars' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'gender' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'gender' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'first' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'page' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'gender' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'paginatorInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'currentPage' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lastPage' } },
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
} as unknown as DocumentNode<AvatarsQuery, AvatarsQueryVariables>;
export const GetEduSystemsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetEduSystems' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'educationalSystems' },
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
} as unknown as DocumentNode<GetEduSystemsQuery, GetEduSystemsQueryVariables>;
export const GetGovernoratesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetGovernorates' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'governorates' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name_ar' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name_en' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetGovernoratesQuery, GetGovernoratesQueryVariables>;
export const SearchCitiesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SearchCities' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'governorate_id' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
        },
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
            name: { kind: 'Name', value: 'searchCities' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'governorate_id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'governorate_id' } },
              },
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
                { kind: 'Field', name: { kind: 'Name', value: 'name_ar' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name_en' } },
                { kind: 'Field', name: { kind: 'Name', value: 'governorate_id' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SearchCitiesQuery, SearchCitiesQueryVariables>;
export const SearchSchoolsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SearchSchools' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
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
            name: { kind: 'Name', value: 'searchSchools' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'search' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name_en' } },
                { kind: 'Field', name: { kind: 'Name', value: 'is_verified' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SearchSchoolsQuery, SearchSchoolsQueryVariables>;
export const AddCityDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddCity' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'governorate_id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
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
            name: { kind: 'Name', value: 'addCity' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'governorate_id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'governorate_id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name_ar' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name_en' } },
                { kind: 'Field', name: { kind: 'Name', value: 'governorate_id' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddCityMutation, AddCityMutationVariables>;
export const AddSchoolDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddSchool' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'governorate' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addSchool' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'governorate' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'governorate' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name_en' } },
                { kind: 'Field', name: { kind: 'Name', value: 'is_verified' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddSchoolMutation, AddSchoolMutationVariables>;
export const GetAppConfigDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetAppConfig' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'appConfig' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'campaignFreeAccess' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetAppConfigQuery, GetAppConfigQueryVariables>;
export const SetLanguageDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SetLanguage' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateProfileInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateProfile' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
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
} as unknown as DocumentNode<SetLanguageMutation, SetLanguageMutationVariables>;
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
export const LessonQuestionTypesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'LessonQuestionTypes' },
      variableDefinitions: [
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
            name: { kind: 'Name', value: 'lessonQuestionTypes' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'lessonIds' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'lessonIds' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                { kind: 'Field', name: { kind: 'Name', value: 'minSelectedTypes' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'types' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'count' } },
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
} as unknown as DocumentNode<LessonQuestionTypesQuery, LessonQuestionTypesQueryVariables>;
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
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'questionTypes' } },
          type: {
            kind: 'ListType',
            type: {
              kind: 'NonNullType',
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
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
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'quizTypeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'quizTypeId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'questionTypes' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'questionTypes' } },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'difficulty' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'imageUrl' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'matchPairs' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'left' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'text' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'right' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'text' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'subQuestions' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'questionNumber' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'question' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'answers' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'imageUrl' } },
                          ],
                        },
                      },
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
                { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                { kind: 'Field', name: { kind: 'Name', value: 'totalQuestions' } },
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
                            { kind: 'Field', name: { kind: 'Name', value: 'imageUrl' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'matchColumns' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'left' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'text' } },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'right' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'text' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'parent' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'question' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'selected_answer' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'is_correct' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'score' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'parent_question_id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'match_results' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'leftId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'rightId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'isCorrect' } },
                          ],
                        },
                      },
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
export const SendContactMessageDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendContactMessage' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'subject' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'message' } },
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
            name: { kind: 'Name', value: 'sendContactMessage' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'email' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'email' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subject' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'subject' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'message' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'message' } },
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
} as unknown as DocumentNode<SendContactMessageMutation, SendContactMessageMutationVariables>;
export const QuestionReportTypesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'QuestionReportTypes' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'questionReportTypes' },
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
} as unknown as DocumentNode<QuestionReportTypesQuery, QuestionReportTypesQueryVariables>;
export const ReportQuestionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ReportQuestion' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'questionId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'reportTypeId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'comment' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reportQuestion' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'questionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'questionId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'reportTypeId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'reportTypeId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'comment' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'comment' } },
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
} as unknown as DocumentNode<ReportQuestionMutation, ReportQuestionMutationVariables>;
