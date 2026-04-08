import { useQuery, useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import {
  PARENT_LINK_REQUESTS_QUERY,
  SEND_PARENT_LINK_REQUEST_MUTATION,
  RESPOND_TO_PARENT_LINK_MUTATION,
  CANCEL_PARENT_LINK_REQUEST_MUTATION,
} from '../graphql/parentingQueries';
import { ParentLinkRequest, ParentSlot, SlotState } from '../types/parenting';

export interface UseParentLinkingReturn {
  slots: [ParentSlot, ParentSlot];
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
  sendLinkRequest: (mobile: string) => Promise<void>;
  respondToLink: (requestId: string, action: 'accept' | 'decline') => Promise<void>;
  cancelLinkRequest: (requestId: string) => Promise<void>;
  isSending: boolean;
  isResponding: boolean;
  isCancelling: boolean;
}

export const useParentLinking = (): UseParentLinkingReturn => {
  const { data, loading, error, refetch } = useQuery<any>(PARENT_LINK_REQUESTS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  if (error) {
    console.error('GraphQL Error in parentLinkRequests:', JSON.stringify(error, null, 2));
  }

  const [sendLink, { loading: isSending }] = useMutation<any>(SEND_PARENT_LINK_REQUEST_MUTATION);
  const [respondLink, { loading: isResponding }] = useMutation<any>(
    RESPOND_TO_PARENT_LINK_MUTATION,
  );
  const [cancelLink, { loading: isCancelling }] = useMutation<any>(
    CANCEL_PARENT_LINK_REQUEST_MUTATION,
  );

  const getSlotState = (request: ParentLinkRequest): SlotState => {
    if (request.status === 'accepted') return 'accepted';
    if (request.status === 'rejected') return 'rejected';
    if (request.status === 'pending') {
      return request.initiated_by === 'student' ? 'pending_outgoing' : 'pending_incoming';
    }
    return 'empty';
  };

  const getSlots = (): [ParentSlot, ParentSlot] => {
    const requests: ParentLinkRequest[] = data?.parentLinkRequests ?? [];

    // Sort: accepted first, pending second, rejected last
    const sorted = [...requests].sort((a, b) => {
      const order = { accepted: 0, pending: 1, rejected: 2 };
      return order[a.status] - order[b.status];
    });

    const slots: ParentSlot[] = sorted.slice(0, 2).map((req) => ({
      state: getSlotState(req),
      request: req,
    }));

    // Pad with empty slots if < 2
    while (slots.length < 2) {
      slots.push({ state: 'empty' });
    }

    return slots as [ParentSlot, ParentSlot];
  };

  const sendLinkRequest = useCallback(
    async (mobile: string) => {
      await sendLink({ variables: { mobile } });
      await refetch();
    },
    [sendLink, refetch],
  );

  const respondToLink = useCallback(
    async (requestId: string, action: 'accept' | 'decline') => {
      await respondLink({ variables: { requestId, action } });
      await refetch();
    },
    [respondLink, refetch],
  );

  const cancelLinkRequest = useCallback(
    async (requestId: string) => {
      console.log('cancelLinkRequest', requestId);
      await cancelLink({ variables: { requestId } });
      await refetch();
    },
    [cancelLink, refetch],
  );

  return {
    slots: getSlots(),
    loading,
    error,
    refetch,
    sendLinkRequest,
    respondToLink,
    cancelLinkRequest,
    isSending,
    isResponding,
    isCancelling,
  };
};
