import { Socket } from 'socket.io';
import { OrderMessageType } from '@prisma/client';

// Extended Socket interface for chat functionality
export interface ChatSocket extends Socket {
  userId?: number;
  userType?: string;
}

// Message types enum
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'LOCATION' | 'VOICE' | 'SYSTEM';

// Core chat message interface
export interface OrderChatMessage {
  id: string;
  orderId: number;
  senderId: number;
  content: string;
  messageType: MessageType;
  createdAt: Date;
  replyToId?: string;
  attachments?: ChatAttachment[];
  senderName?: string;
  senderType?: string;
  isEdited?: boolean;
  editedAt?: Date;
}

// Chat attachment interface
export interface ChatAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

// Typing status interface
export interface TypingStatus {
  orderId: number;
  userId: number;
  isTyping: boolean;
  startedAt: Date;
  userType: string;
  userName: string;
}

// Online status interface
export interface OnlineStatus {
  userId: number;
  isOnline: boolean;
  lastSeen: Date;
  socketId: string;
  userType: string;
  userName: string;
  avatar?: string;
}

// Chat room information
export interface ChatRoomInfo {
  orderId: number;
  customerName: string;
  providerName: string;
  customerId: number;
  providerId: number;
  orderStatus: string;
  createdAt: Date;
  lastMessageAt?: Date;
  unreadCount?: number;
}

// Chat history response
export interface ChatHistoryResponse {
  orderId: number;
  messages: OrderChatMessage[];
  page: number;
  limit: number;
  totalPages: number;
  totalMessages: number;
  hasMore: boolean;
}

// Socket event payload interfaces
export interface ChatAuthenticationPayload {
  userId: number;
  token?: string;
}

export interface ChatAuthenticationResponse {
  success: boolean;
  userId: number;
  userType: string;
  userName: string;
  error?: string;
}

export interface JoinOrderChatPayload {
  orderId: number;
}

export interface JoinOrderChatResponse {
  orderId: number;
  customerName: string;
  providerName: string;
  roomId: string;
  participants: ChatParticipant[];
}

export interface LeaveOrderChatPayload {
  orderId: number;
}

export interface SendMessagePayload {
  orderId: number;
  content: string;
  messageType?: MessageType;
  replyToId?: string;
  attachments?: ChatAttachment[];
  metadata?: Record<string, any>;
}

export interface SendMessageResponse {
  success: boolean;
  message?: OrderChatMessage;
  error?: string;
}

export interface TypingIndicatorPayload {
  orderId: number;
  isTyping: boolean;
}

export interface GetChatHistoryPayload {
  orderId: number;
  page?: number;
  limit?: number;
  beforeMessageId?: string;
  afterMessageId?: string;
}

export interface ChatErrorPayload {
  message: string;
  code?: string;
  orderId?: number;
}

// Chat participant interface
export interface ChatParticipant {
  userId: number;
  userType: string;
  userName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  role: 'Customer' | 'Provider';
}

// User joined/left events
export interface UserJoinedChatPayload {
  orderId: number;
  userId: number;
  userType: string;
  userName: string;
  joinedAt: Date;
}

export interface UserLeftChatPayload {
  orderId: number;
  userId: number;
  userType: string;
  leftAt: Date;
}

// New message notification
export interface NewMessageNotification {
  message: OrderChatMessage;
  orderId: number;
  isSystemMessage: boolean;
  mentionsUser?: boolean;
}

// User typing notification
export interface UserTypingNotification {
  orderId: number;
  userId: number;
  userType: string;
  userName: string;
  isTyping: boolean;
  startedAt?: Date;
}

// Online users update
export interface OnlineUsersUpdate {
  users: OnlineStatus[];
  totalOnline: number;
  lastUpdated: Date;
}

// Chat statistics
export interface ChatStatistics {
  orderId: number;
  totalMessages: number;
  totalParticipants: number;
  messagesLast24h: number;
  averageResponseTime: number; // in seconds
  mostActiveUser: {
    userId: number;
    userName: string;
    messageCount: number;
  };
  lastActivity: Date;
}

// Message delivery status
export interface MessageDeliveryStatus {
  messageId: string;
  deliveredTo: number[]; // user IDs
  readBy: number[]; // user IDs
  deliveredAt: Date;
  readAt?: Date;
}

// Chat settings
export interface ChatSettings {
  orderId: number;
  notifications: {
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
}

// System message types
export type SystemMessageType =
  | 'order_created'
  | 'order_accepted'
  | 'order_started'
  | 'order_completed'
  | 'order_cancelled'
  | 'payment_received'
  | 'provider_arrived'
  | 'service_started'
  | 'service_completed'
  | 'rating_submitted'
  | 'user_joined'
  | 'user_left'
  | 'chat_created';

// System message payload
export interface SystemMessagePayload {
  orderId: number;
  type: SystemMessageType;
  content: string;
  metadata?: Record<string, any>;
  triggeredBy?: number; // user ID who triggered the system message
}

// Chat event names (for type safety)
export const CHAT_EVENTS = {
  // Authentication
  AUTHENTICATE: 'chat-authenticate',
  AUTHENTICATED: 'chat-authenticated',
  AUTHENTICATION_FAILED: 'chat-authentication-failed',

  // Room management
  JOIN_ORDER: 'chat-join-order',
  JOINED_ORDER: 'chat-joined-order',
  LEAVE_ORDER: 'chat-leave-order',
  LEFT_ORDER: 'chat-left-order',

  // Messaging
  SEND_MESSAGE: 'chat-send-message',
  NEW_MESSAGE: 'chat-new-message',
  MESSAGE_SENT: 'chat-message-sent',
  MESSAGE_DELIVERED: 'chat-message-delivered',
  MESSAGE_READ: 'chat-message-read',

  // History
  GET_HISTORY: 'chat-get-history',
  HISTORY: 'chat-history',

  // Typing indicators
  TYPING: 'chat-typing',
  USER_TYPING: 'chat-user-typing',

  // User presence
  USER_JOINED: 'chat-user-joined',
  USER_LEFT: 'chat-user-left',
  ONLINE_USERS: 'chat-online-users',
  USER_STATUS_CHANGED: 'chat-user-status-changed',

  // System
  SYSTEM_MESSAGE: 'chat-system-message',
  ERROR: 'chat-error',
  RECONNECTED: 'chat-reconnected',

  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
} as const;

// Chat event types for type safety
export type ChatEventType = (typeof CHAT_EVENTS)[keyof typeof CHAT_EVENTS];

// Chat handler configuration
export interface ChatHandlerConfig {
  typingTimeout: number; // milliseconds
  maxMessageLength: number;
  maxAttachmentSize: number; // bytes
  allowedFileTypes: string[];
  messageHistoryLimit: number;
  onlineStatusBroadcastInterval: number; // milliseconds
  enableMessageDeliveryStatus: boolean;
  enableReadReceipts: boolean;
  enableTypingIndicators: boolean;
}

// Default chat configuration
export const DEFAULT_CHAT_CONFIG: ChatHandlerConfig = {
  typingTimeout: 3000,
  maxMessageLength: 4000,
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  messageHistoryLimit: 100,
  onlineStatusBroadcastInterval: 30000,
  enableMessageDeliveryStatus: true,
  enableReadReceipts: true,
  enableTypingIndicators: true,
};

// Chat validation schemas (for runtime validation)
export interface ChatValidationResult {
  isValid: boolean;
  errors: string[];
}

// Chat permission interface
export interface ChatPermissions {
  canSendMessage: boolean;
  canSendAttachment: boolean;
  canDeleteMessage: boolean;
  canEditMessage: boolean;
  canViewHistory: boolean;
  canMentionUsers: boolean;
  canSendSystemMessage: boolean;
}

// Chat analytics event
export interface ChatAnalyticsEvent {
  eventType: 'message_sent' | 'message_received' | 'user_joined' | 'user_left' | 'typing_started' | 'typing_stopped';
  orderId: number;
  userId: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Rate limiting interface
export interface RateLimit {
  userId: number;
  orderId: number;
  messageCount: number;
  windowStart: Date;
  isBlocked: boolean;
  blockedUntil?: Date;
}

// Chat backup/export interface
export interface ChatExport {
  orderId: number;
  exportedAt: Date;
  exportedBy: number;
  messages: OrderChatMessage[];
  participants: ChatParticipant[];
  metadata: {
    totalMessages: number;
    dateRange: {
      from: Date;
      to: Date;
    };
    exportFormat: 'json' | 'csv' | 'pdf';
  };
}
