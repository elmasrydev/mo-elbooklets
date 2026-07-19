import { useQuery, useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import {
  ParentLinkRequestsDocument,
  SendParentLinkRequestDocument,
  RespondToParentLinkDocument,
  CancelParentLinkRequestDocument,
} from '../generated/graphql';
import { ParentLinkRequest, ParentSlot } from '../types/parenting';
import { buildSlots } from '../utils/parentSlots';

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
  const { data, loading, error, refetch } = useQuery(ParentLinkRequestsDocument, {
    fetchPolicy: 'cache-and-network',
  });

  if (error) {
    console.error('GraphQL Error in parentLinkRequests:', JSON.stringify(error, null, 2));
  }

  const [sendLink, { loading: isSending }] = useMutation(SendParentLinkRequestDocument);
  const [respondLink, { loading: isResponding }] = useMutation(RespondToParentLinkDocument);
  const [cancelLink, { loading: isCancelling }] = useMutation(CancelParentLinkRequestDocument);

  const getSlots = (): [ParentSlot, ParentSlot] =>
    // The wire type is stringly (the schema declares String, not enums); the
    // server upholds the ParentLinkStatus/InitiatedBy domains buildSlots needs.
    buildSlots((data?.parentLinkRequests ?? []) as ParentLinkRequest[]);

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
