export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  channel: string;
  event_slug: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

export type NotificationEventSlug =
  | 'link_request_received'
  | 'link_request_accepted'
  | 'link_request_declined'
  | 'new_follower'
  | 'post_liked'  // assumed slug — update if backend uses a different value
  | (string & {}); // allow unknown slugs without breaking the type
