import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';

import {
  MyLinkedChildrenDocument,
  MyLinkedChildrenQuery,
  ParentCancelLinkRequestDocument,
  ParentChildRequestsDocument,
  ParentChildRequestsQuery,
  ParentRespondToLinkDocument,
  ParentSendLinkRequestDocument,
} from '../generated/graphql';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { loadFailureMessage } from '../utils/queryError';

export type Child = MyLinkedChildrenQuery['linkedChildren'][number];
export type LinkRequest = ParentChildRequestsQuery['parentChildRequests'][number];

export const useParentDashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  // Separate from the query's `loading` so submitting the add-child modal never
  // flips the dashboard's empty-state spinner (and vice-versa).
  const [adding, setAdding] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { parentUser } = useAuth();
  const { t } = useTranslation();
  const { showConfirm } = useModal();

  const childrenQuery = useQuery(MyLinkedChildrenDocument, {
    skip: !parentUser,
    notifyOnNetworkStatusChange: true,
  });
  const requestsQuery = useQuery(ParentChildRequestsDocument, {
    skip: !parentUser,
    notifyOnNetworkStatusChange: true,
  });

  const children = childrenQuery.data?.linkedChildren ?? [];
  const incomingRequests = (requestsQuery.data?.parentChildRequests ?? []).filter(
    // Only genuinely pending requests are actionable. Allow-list 'pending'
    // instead of excluding known terminal states, so unexpected backend
    // statuses (e.g. cancelled/expired) aren't surfaced as accept/declinable.
    (request) => request.status.toLowerCase() === 'pending',
  );
  const loading = childrenQuery.loading || requestsQuery.loading;

  const fetchDashboardData = useCallback(async () => {
    await Promise.all([childrenQuery.refetch(), requestsQuery.refetch()]);
    // Refetch functions are stable for the life of the hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Surface a load failure once per failed attempt, and only when nothing
  // usable arrived — a partial response still renders (see utils/queryError).
  const loadError =
    loadFailureMessage(
      childrenQuery.data?.linkedChildren,
      childrenQuery.error,
      t('parent_dashboard.load_failed'),
    ) ??
    loadFailureMessage(
      requestsQuery.data?.parentChildRequests,
      requestsQuery.error,
      t('parent_dashboard.load_failed'),
    );
  const reportedErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!loadError) {
      reportedErrorRef.current = null;
      return;
    }
    if (reportedErrorRef.current === loadError) return;
    reportedErrorRef.current = loadError;
    showConfirm({
      title: t('common.error'),
      message: loadError,
      showCancel: false,
      onConfirm: () => {},
    });
  }, [loadError, showConfirm, t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  const [sendLinkRequest] = useMutation(ParentSendLinkRequestDocument);
  const [respondToLink] = useMutation(ParentRespondToLinkDocument);
  const [cancelLinkRequest] = useMutation(ParentCancelLinkRequestDocument);

  const handleAddChild = async (childMobile: string) => {
    setAdding(true);
    try {
      await sendLinkRequest({ variables: { mobile: childMobile } });
      showConfirm({
        title: t('common.success'),
        message: t('parent_dashboard.invite_sent_success'),
        showCancel: false,
        onConfirm: () => fetchDashboardData(),
      });
      return true;
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      showConfirm({
        title: t('common.error'),
        // The backend's message is localized and actionable here ("no student
        // with this mobile"), unlike a load failure — show it as-is.
        message: err.message || t('parent_dashboard.invite_error'),
        showCancel: false,
        onConfirm: () => {},
      });
      return false;
    } finally {
      setAdding(false);
    }
  };

  const handleRespondToLink = async (requestId: string, status: 'ACCEPTED' | 'DECLINED') => {
    setRespondingId(requestId);
    const action = status === 'ACCEPTED' ? 'accept' : 'decline';
    try {
      await respondToLink({ variables: { requestId, action } });
      showConfirm({
        title: t('common.success'),
        message:
          status === 'ACCEPTED'
            ? t('parent_dashboard.request_accepted')
            : t('parent_dashboard.request_declined'),
        showCancel: false,
        onConfirm: () => fetchDashboardData(),
      });
      return true;
    } catch (err: any) {
      console.error('Error responding to link:', err);
      showConfirm({
        title: t('common.error'),
        message: err.message || t('common.unexpected_error'),
        showCancel: false,
        onConfirm: () => {},
      });
      return false;
    } finally {
      setRespondingId(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setRespondingId(requestId);
    try {
      await cancelLinkRequest({ variables: { requestId } });
      showConfirm({
        title: t('common.success'),
        message: t('parent_dashboard.request_cancelled'),
        showCancel: false,
        onConfirm: () => fetchDashboardData(),
      });
      return true;
    } catch (err: any) {
      console.error('Error cancelling request:', err);
      showConfirm({
        title: t('common.error'),
        message: err.message || t('common.unexpected_error'),
        showCancel: false,
        onConfirm: () => {},
      });
      return false;
    } finally {
      setRespondingId(null);
    }
  };

  return {
    children,
    incomingRequests,
    loading,
    refreshing,
    adding,
    respondingId,
    handleRefresh,
    handleRespondToLink,
    handleCancelRequest,
    handleAddChild,
  };
};
