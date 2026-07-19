import { useState, useCallback, useEffect } from 'react';
import { checkForAuthError, tryFetchWithFallback } from '../config/api';
import { MyLinkedChildrenDocument, ParentChildRequestsDocument } from '../generated/graphql';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useModal } from '../context/ModalContext';

export interface Child {
  id: string;
  name: string;
  mobile: string;
  grade?: { name: string };
  educational_system?: { name: string };
  /** Optional — children who never picked an avatar fall back to initials. */
  selectedAvatar?: { url?: string | null } | null;
}

export interface LinkRequest {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'DECLINED' | 'ACCEPTED';
  initiated_by: 'student' | 'parent';
  child: {
    name: string;
    mobile: string;
    school_name?: string;
  };
  created_at: string;
}

export const useParentDashboard = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Separate from `loading` so submitting the add-child modal never flips the
  // dashboard's empty-state spinner (and vice-versa).
  const [adding, setAdding] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { parentUser } = useAuth();
  const { t } = useTranslation();
  const { showConfirm } = useModal();

  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [childrenRes, requestsRes] = await Promise.all([
          tryFetchWithFallback(MyLinkedChildrenDocument),
          tryFetchWithFallback(ParentChildRequestsDocument),
        ]);

        if (childrenRes.data?.linkedChildren) {
          setChildren(childrenRes.data.linkedChildren);
        }

        if (requestsRes.data?.parentChildRequests) {
          setIncomingRequests(
            requestsRes.data.parentChildRequests.filter(
              // Only genuinely pending requests are actionable. Allow-list 'pending'
              // instead of excluding known terminal states, so unexpected backend
              // statuses (e.g. cancelled/expired) aren't surfaced as accept/declinable.
              (r: LinkRequest) => r.status.toLowerCase() === 'pending',
            ),
          );
        }

        // tryFetchWithFallback resolves HTTP-200 GraphQL errors instead of
        // throwing (the same trap handleAddChild guards against) — without this
        // check a failing query would leave the parent staring at an empty
        // "no children" state with no explanation. Auth errors are exempt:
        // they already route through the global logout handler inside
        // tryFetchWithFallback, so don't stack a load-failure popup on that.
        const gqlError = childrenRes.errors?.[0] || requestsRes.errors?.[0];
        if (gqlError && !checkForAuthError(childrenRes) && !checkForAuthError(requestsRes)) {
          throw new Error(gqlError.message || 'GraphQL error');
        }
      } catch (err) {
        console.error('Error fetching parent dashboard data:', err);
        showConfirm({
          title: t('common.error'),
          // Generic copy, not err.message: load failures surface raw GraphQL
          // internals, unlike the localized messages the mutations return.
          message: t('parent_dashboard.load_failed'),
          showCancel: false,
          onConfirm: () => {},
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
      // Both deps are stable (showConfirm is a []-dep useCallback); t changes
      // only on language switch, where a refetch is harmless.
    },
    [showConfirm, t],
  );

  const handleRefresh = () => fetchDashboardData(true);

  const handleAddChild = async (childMobile: string) => {
    setAdding(true);
    try {
      const result = await tryFetchWithFallback(
        `
        mutation ParentSendLinkRequest($mobile: String!) {
          parentSendLinkRequest(child_mobile: $mobile) {
            id
            status
          }
        }
      `,
        { mobile: childMobile },
      );

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

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
      const result = await tryFetchWithFallback(
        `
        mutation ParentRespondToLink($requestId: ID!, $action: String!) {
          parentRespondToLink(request_id: $requestId, action: $action) {
            id
            status
          }
        }
      `,
        { requestId, action },
      );

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const successMsg =
        status === 'ACCEPTED'
          ? t('parent_dashboard.request_accepted')
          : t('parent_dashboard.request_declined');

      showConfirm({
        title: t('common.success'),
        message: successMsg,
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
      const result = await tryFetchWithFallback(
        `
        mutation ParentCancelLinkRequest($requestId: ID!) {
          parentCancelLinkRequest(request_id: $requestId) {
            success
            message
          }
        }
      `,
        { requestId },
      );

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

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

  useEffect(() => {
    if (parentUser) {
      fetchDashboardData();
    }
  }, [parentUser, fetchDashboardData]);

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
