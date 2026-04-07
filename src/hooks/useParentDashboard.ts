import { useState, useCallback, useEffect } from 'react';
import { tryFetchWithFallback } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useModal } from '../context/ModalContext';

export interface Child {
  id: string;
  name: string;
  mobile: string;
  grade?: { name: string };
  educational_system?: { name: string };
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
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { parentUser } = useAuth();
  const { t } = useTranslation();
  const { showConfirm } = useModal();

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [childrenRes, requestsRes] = await Promise.all([
        tryFetchWithFallback(`
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
        `),
        tryFetchWithFallback(`
          query ParentChildRequests {
            parentChildRequests {
              id
              status
              initiated_by
              created_at
              child {
                name
                mobile
                school_name
              }
            }
          }
        `),
      ]);

      if (childrenRes.data?.linkedChildren) {
        setChildren(childrenRes.data.linkedChildren);
      }

      if (requestsRes.data?.parentChildRequests) {
        setIncomingRequests(
          requestsRes.data.parentChildRequests.filter(
            (r: LinkRequest) => {
              const status = r.status.toLowerCase();
              return status !== 'accepted' && status !== 'declined' && status !== 'rejected';
            },
          ),
        );
      }
    } catch (err) {
      console.error('Error fetching parent dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => fetchDashboardData(true);

  const handleAddChild = async (childMobile: string) => {
    setLoading(true);
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
      setLoading(false);
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
    respondingId,
    handleRefresh,
    handleRespondToLink,
    handleCancelRequest,
    handleAddChild,
  };
};
