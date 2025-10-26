// Core data types for the bill splitting app

export interface BillItem {
  id: string;
  sessionId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  lineNumber: number;
}

export interface Participant {
  id: string;
  sessionId: string;
  userId?: string;
  guestName?: string;
  amountOwed: number;
  amountPaid: number;
  paymentStatus: 'pending' | 'paid' | 'settled';
  joinedAt: string;
}

export interface ItemAssignment {
  id: string;
  itemId: string;
  participantId: string;
  splitPercentage: number; // 0-1 (e.g., 0.5 = 50%)
  amount: number;
}

export interface Session {
  id: string;
  sessionCode: string;
  createdBy?: string;
  restaurantName?: string;
  receiptImageUrl?: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  items: BillItem[];
  participants: Participant[];
  assignments: ItemAssignment[];
}

export interface Receipt {
  id: string;
  restaurantName?: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  confidence?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  paymentMethods?: {
    venmo?: string;
    paypal?: string;
    cashapp?: string;
  };
}

// WebSocket event types
export type WebSocketEvent =
  | { type: 'join_session'; sessionId: string; participantId: string }
  | { type: 'leave_session'; sessionId: string; participantId: string }
  | { type: 'item_assigned'; sessionId: string; assignment: ItemAssignment }
  | { type: 'participant_joined'; sessionId: string; participant: Participant }
  | { type: 'payment_updated'; sessionId: string; participantId: string; paymentStatus: string }
  | { type: 'bill_updated'; sessionId: string; session: Session };

// API request/response types
export interface CreateSessionRequest {
  restaurantName?: string;
  items?: BillItem[];
}

export interface UploadReceiptRequest {
  image: File;
}

export interface JoinSessionRequest {
  sessionCode: string;
  guestName?: string;
}

export interface AssignItemRequest {
  itemId: string;
  participantIds: string[];
  splitEqually?: boolean;
}
