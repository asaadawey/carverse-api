import {
  ChatAuthenticationPayload,
  SendMessagePayload,
  JoinOrderChatPayload,
  TypingIndicatorPayload,
  GetChatHistoryPayload,
  ChatValidationResult,
  DEFAULT_CHAT_CONFIG,
} from '../types/chat.types';

/**
 * Validates chat authentication payload
 */
export function validateAuthenticationPayload(data: any): ChatValidationResult {
  const errors: string[] = [];

  if (!data) {
    errors.push('Authentication data is required');
    return { isValid: false, errors };
  }

  if (!data.userId || typeof data.userId !== 'number') {
    errors.push('Valid userId is required');
  }

  if (data.token && typeof data.token !== 'string') {
    errors.push('Token must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates send message payload
 */
export function validateSendMessagePayload(data: any): ChatValidationResult {
  const errors: string[] = [];

  if (!data) {
    errors.push('Message data is required');
    return { isValid: false, errors };
  }

  if (!data.orderId || typeof data.orderId !== 'number') {
    errors.push('Valid orderId is required');
  }

  if (!data.content || typeof data.content !== 'string') {
    errors.push('Message content is required');
  } else if (data.content.length > DEFAULT_CHAT_CONFIG.maxMessageLength) {
    errors.push(`Message content exceeds maximum length of ${DEFAULT_CHAT_CONFIG.maxMessageLength} characters`);
  } else if (data.content.trim().length === 0) {
    errors.push('Message content cannot be empty');
  }

  if (data.messageType && !['TEXT', 'IMAGE', 'FILE', 'LOCATION', 'VOICE'].includes(data.messageType)) {
    errors.push('Invalid message type');
  }

  if (data.replyToId && typeof data.replyToId !== 'string') {
    errors.push('ReplyToId must be a string');
  }

  if (data.attachments && !Array.isArray(data.attachments)) {
    errors.push('Attachments must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates join order chat payload
 */
export function validateJoinOrderPayload(data: any): ChatValidationResult {
  const errors: string[] = [];

  if (!data) {
    errors.push('Join order data is required');
    return { isValid: false, errors };
  }

  if (!data.orderId || typeof data.orderId !== 'number') {
    errors.push('Valid orderId is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates typing indicator payload
 */
export function validateTypingPayload(data: any): ChatValidationResult {
  const errors: string[] = [];

  if (!data) {
    errors.push('Typing data is required');
    return { isValid: false, errors };
  }

  if (!data.orderId || typeof data.orderId !== 'number') {
    errors.push('Valid orderId is required');
  }

  if (typeof data.isTyping !== 'boolean') {
    errors.push('isTyping must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates get chat history payload
 */
export function validateGetHistoryPayload(data: any): ChatValidationResult {
  const errors: string[] = [];

  if (!data) {
    errors.push('History data is required');
    return { isValid: false, errors };
  }

  if (!data.orderId || typeof data.orderId !== 'number') {
    errors.push('Valid orderId is required');
  }

  if (data.page && (typeof data.page !== 'number' || data.page < 1)) {
    errors.push('Page must be a positive number');
  }

  if (data.limit && (typeof data.limit !== 'number' || data.limit < 1 || data.limit > 100)) {
    errors.push('Limit must be a number between 1 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates attachment data
 */
export function validateAttachment(attachment: any): ChatValidationResult {
  const errors: string[] = [];

  if (!attachment) {
    errors.push('Attachment data is required');
    return { isValid: false, errors };
  }

  if (!attachment.fileName || typeof attachment.fileName !== 'string') {
    errors.push('Valid fileName is required');
  }

  if (!attachment.fileSize || typeof attachment.fileSize !== 'number' || attachment.fileSize <= 0) {
    errors.push('Valid fileSize is required');
  }

  if (attachment.fileSize > DEFAULT_CHAT_CONFIG.maxAttachmentSize) {
    errors.push(`File size exceeds maximum allowed size of ${DEFAULT_CHAT_CONFIG.maxAttachmentSize} bytes`);
  }

  if (!attachment.fileType || typeof attachment.fileType !== 'string') {
    errors.push('Valid fileType is required');
  }

  if (!DEFAULT_CHAT_CONFIG.allowedFileTypes.includes(attachment.fileType)) {
    errors.push(`File type ${attachment.fileType} is not allowed`);
  }

  if (!attachment.fileUrl || typeof attachment.fileUrl !== 'string') {
    errors.push('Valid fileUrl is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes message content
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove any potential HTML/script tags
  const sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();

  return sanitized.substring(0, DEFAULT_CHAT_CONFIG.maxMessageLength);
}

/**
 * Validates user permissions for chat actions
 */
export function validateChatPermissions(
  userId: number,
  orderId: number,
  action: 'send_message' | 'view_history' | 'join_chat' | 'send_attachment',
): boolean {
  // Basic validation - in a real implementation, you would check database
  // for user's role and permissions for the specific order

  if (!userId || !orderId) {
    return false;
  }

  // For now, we assume all authenticated users have basic permissions
  // This should be enhanced with proper role-based access control
  return true;
}

/**
 * Checks if user is rate limited
 */
export function checkRateLimit(userId: number, orderId: number): boolean {
  // Implement rate limiting logic here
  // For now, we'll return false (not rate limited)

  // In a real implementation, you would:
  // 1. Check Redis/memory store for user's recent activity
  // 2. Count messages sent in the last X minutes
  // 3. Return true if user exceeds the limit

  return false;
}

/**
 * Type guard to check if object is a valid ChatSocket
 */
export function isChatSocket(socket: any): boolean {
  return (
    socket &&
    typeof socket.emit === 'function' &&
    typeof socket.on === 'function' &&
    typeof socket.join === 'function' &&
    typeof socket.leave === 'function'
  );
}

/**
 * Creates a safe error message for client
 */
export function createSafeErrorMessage(error: any, defaultMessage: string = 'An error occurred'): string {
  // Don't expose internal error details to client
  if (error && typeof error.message === 'string') {
    // Only return safe, user-friendly error messages
    const safeMessages = [
      'Not authenticated',
      'Not authorized',
      'Message too long',
      'Invalid message type',
      'Failed to send message',
      'Failed to join chat',
      'Failed to get chat history',
      'Order not found',
      'User not found',
    ];

    if (safeMessages.some((safe) => error.message.includes(safe))) {
      return error.message;
    }
  }

  return defaultMessage;
}

/**
 * Formats message timestamp for client
 */
export function formatMessageTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Generates a unique room name for order chat
 */
export function generateOrderChatRoom(orderId: number): string {
  return `order_chat_${orderId}`;
}

/**
 * Extracts user type from socket or user data
 */
export function extractUserType(socket: any): string {
  return socket.userType || 'Unknown';
}

/**
 * Validates message thread/reply structure
 */
export function validateMessageThread(replyToId?: string, parentMessage?: any): ChatValidationResult {
  const errors: string[] = [];

  if (replyToId && !parentMessage) {
    errors.push('Parent message not found for reply');
  }

  if (parentMessage && parentMessage.messageType === 'SYSTEM') {
    errors.push('Cannot reply to system messages');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
