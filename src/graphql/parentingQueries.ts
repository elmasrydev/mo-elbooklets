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

