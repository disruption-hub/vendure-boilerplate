// Stub for ChatContact type
export interface ChatContact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  unreadCount?: number;
  lastMessageAt?: string | null;
  [key: string]: any;
}

