import { gql } from '@apollo/client';

export const PARENT_LINK_REQUESTS_QUERY = gql`
  query ParentLinkRequests {
    parentLinkRequests {
      id
      status
      initiated_by
      parent {
        name
        mobile
      }
      created_at
    }
  }
`;

export const SEND_PARENT_LINK_REQUEST_MUTATION = gql`
  mutation SendParentLinkRequest($mobile: String!) {
    sendParentLinkRequest(parent_mobile: $mobile) {
      id
      status
      initiated_by
      parent {
        name
      }
    }
  }
`;

export const RESPOND_TO_PARENT_LINK_MUTATION = gql`
  mutation RespondToParentLink($requestId: ID!, $action: String!) {
    respondToParentLink(request_id: $requestId, action: $action) {
      id
      status
    }
  }
`;

export const CANCEL_PARENT_LINK_REQUEST_MUTATION = gql`
  mutation CancelParentLinkRequest($requestId: ID!) {
    cancelParentLinkRequest(request_id: $requestId) {
      success
      message
    }
  }
`;

/**
 * PARENT APP AUTH MUTATIONS
 */

export const PARENT_REGISTER_MUTATION = gql`
  mutation ParentRegister($name: String!, $mobile: String!, $email: String!, $password: String!) {
    parentRegister(input: {
      name: $name,
      mobile: $mobile,
      email: $email,
      password: $password
    }) {
      access_token
      token_type
      parent {
        id
        name
        mobile
        email
      }
    }
  }
`;

export const PARENT_LOGIN_MUTATION = gql`
  mutation ParentLogin($mobile: String!, $password: String!) {
    parentLogin(input: {
      mobile: $mobile,
      password: $password
    }) {
      access_token
      token_type
      parent {
        id
        name
        mobile
      }
    }
  }
`;

export const PARENT_ME_QUERY = gql`
  query ParentMe {
    parentMe {
      id
      name
      mobile
      country_code
    }
  }
`;

/**
 * PARENT APP DASHBOARD QUERIES & MUTATIONS
 */

export const MY_LINKED_CHILDREN_QUERY = gql`
  query MyLinkedChildren {
    linkedChildren {
      id
      name
      mobile
      grade {
        name
      }
      educational_system {
        name
      }
    }
  }
`;

export const PARENT_CANCEL_LINK_REQUEST_MUTATION = gql`
  mutation ParentCancelLinkRequest($requestId: ID!) {
    parentCancelLinkRequest(request_id: $requestId) {
      success
      message
    }
  }
`;

export const GET_CHILD_DASHBOARD_QUERY = gql`
  query GetChildDashboard($childId: ID!) {
    childDashboard(child_id: $childId) {
      child {
        name
      }
      quizzes_solved
      average_score
      started_subjects_count
      
      subject_performance {
        subject_name
        quiz_count
        avg_score
      }
      
      recent_activity {
        quiz_name
        subject_name
        score
        total_questions
        is_passed
        completed_at
      }
      
      wheel_of_success {
        overall_percentage
        subject_metrics {
          subject_name
          score
        }
      }
      
      today_schedule {
        date
        is_school_day
        entries {
          id
          subject { name }
          lesson_goal
          quiz_goal
          lessons_viewed
          quizzes_solved
          is_completed
        }
      }
    }
  }
`;

export const PARENT_FORGOT_PASSWORD_MUTATION = gql`
  mutation ParentForgotPassword($email: String!) {
    parentForgotPassword(email: $email) {
      success
      message
    }
  }
`;


