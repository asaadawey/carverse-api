// Chat Types
export * from './types/chat.types';

// Chat Utilities
export * from './utils/chatValidation';

// Re-export commonly used interfaces for convenience
export type {
  ChatSocket,
  OrderChatMessage,
  TypingStatus,
  OnlineStatus,
  ChatAuthenticationPayload,
  ChatAuthenticationResponse,
  SendMessagePayload,
  SendMessageResponse,
  JoinOrderChatPayload,
  JoinOrderChatResponse,
  NewMessageNotification,
  UserTypingNotification,
  ChatHistoryResponse,
  ChatErrorPayload,
  MessageType,
  SystemMessageType,
} from './types/chat.types';

// Re-export commonly used constants
export { CHAT_EVENTS, DEFAULT_CHAT_CONFIG } from './types/chat.types';

// Re-export validation functions
export {
  validateAuthenticationPayload,
  validateSendMessagePayload,
  validateJoinOrderPayload,
  validateTypingPayload,
  validateGetHistoryPayload,
  validateAttachment,
  sanitizeMessageContent,
  createSafeErrorMessage,
  generateOrderChatRoom,
} from './utils/chatValidation';
