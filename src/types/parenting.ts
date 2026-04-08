export type ParentLinkStatus = 'pending' | 'accepted' | 'rejected';
export type InitiatedBy = 'parent' | 'student';

export interface ParentInfo {
  name: string;
  mobile: string;
}

export interface ParentLinkRequest {
  id: string;
  status: ParentLinkStatus;
  initiated_by: InitiatedBy;
  parent: ParentInfo;
  created_at: string;
}

// The 5 visual states for a slot card
export type SlotState = 'empty' | 'pending_outgoing' | 'pending_incoming' | 'accepted' | 'rejected';

export interface ParentSlot {
  state: SlotState;
  request?: ParentLinkRequest; // undefined only when state = 'empty'
}
