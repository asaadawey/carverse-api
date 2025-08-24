# Provider-Customer Real-Time Chat System

## Overview

A comprehensive real-time chat system between car wash providers and customers with typing indicators, message status tracking, and online presence features.

## Features Implemented

### 🗄️ Database Models

- **chatConversations**: Main conversation threads between providers and customers
- **providerCustomerMessages**: Individual messages with status tracking
- **chatParticipants**: User participation and unread count management
- **chatTypingStatus**: Real-time typing indicators
- **userOnlineStatus**: Online/offline presence tracking

### 🌐 REST API Endpoints

Base URL: `/api/provider-customer-chat`

#### Conversations

- `POST /conversations` - Start new conversation between provider and customer
- `GET /conversations` - Get user's active conversations
- `GET /conversations/:conversationId/messages` - Get conversation message history
- `PATCH /conversations/:conversationId/read` - Mark conversation as read
- `PATCH /conversations/:conversationId/archive` - Archive conversation

#### Status & Presence

- `GET /online-users` - Get list of currently online users
- `GET /conversations/:conversationId/typing` - Get typing status for conversation

### ⚡ Real-Time Features (Socket.io)

- **Authentication**: `chat-authenticate` event for secure connection
- **Conversations**: Join/leave conversation rooms
- **Messaging**: Real-time message delivery with status updates
- **Typing Indicators**: Live typing status broadcasting
- **Online Presence**: Real-time online/offline status updates
- **Message Status**: Delivered/read receipts

## Installation & Dependencies

### Already Installed Dependencies

```json
{
  "socket.io": "^4.x.x",
  "moment": "^2.30.1",
  "lodash.debounce": "^4.0.8",
  "nanoid": "^5.0.9",
  "@types/lodash.debounce": "^4.0.9"
}
```

### Database Schema

The following models have been added to `prisma/schema.prisma`:

```prisma
model chatConversations {
  id              String                @id @default(cuid())
  customerId      Int
  providerId      Int
  orderId         Int?
  status          ChatConversationStatus @default(ACTIVE)
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  lastMessageAt   DateTime?

  // Relationships
  customer        users                 @relation("CustomerChats", fields: [customerId], references: [id])
  provider        provider              @relation("ProviderChats", fields: [providerId], references: [id])
  order           orders?               @relation(fields: [orderId], references: [id])
  messages        providerCustomerMessages[]
  participants    chatParticipants[]
  typingUsers     chatTypingStatus[]
}

model providerCustomerMessages {
  id              String            @id @default(cuid())
  conversationId  String
  senderId        Int
  receiverId      Int
  messageType     ProviderChatMessageType @default(TEXT)
  content         String
  attachments     Json?
  status          MessageStatus     @default(SENT)
  readAt          DateTime?
  deliveredAt     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  replyToId       String?
  metadata        Json?

  // Relationships and indexes
}

enum ChatConversationStatus {
  ACTIVE
  ARCHIVED
  BLOCKED
  ENDED
}

enum ProviderChatMessageType {
  TEXT
  IMAGE
  FILE
  LOCATION
  VOICE
  SYSTEM
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
  FAILED
}
```

## Setup Instructions

### 1. Database Migration

The migration has already been applied:

```bash
npx prisma migrate dev --name add_provider_customer_chat_system
```

### 2. Regenerate Prisma Client

**⚠️ IMPORTANT**: Run this command to enable full functionality:

```bash
npx prisma generate
```

### 3. Socket.io Integration

The chat handlers are ready in `src/web-socket/chatSocket.ts`. To integrate:

1. Add chat event types to the existing Socket.io TypeScript interfaces
2. Import and initialize `ChatSocketHandler` in `src/web-socket/index.ts`
3. Update Socket.io event types to include chat events

### 4. Frontend Integration Examples

#### Initialize Chat Connection

```javascript
const socket = io();

// Authenticate user for chat
socket.emit('chat-authenticate', {
  userId: currentUser.id,
  token: authToken,
});

socket.on('chat-authenticated', (data) => {
  console.log('Chat authenticated:', data);
});
```

#### Join Conversation

```javascript
socket.emit('chat-join-conversation', {
  conversationId: 'conv_123',
});

socket.on('chat-joined-conversation', (data) => {
  console.log('Joined conversation:', data.conversationId);
});
```

#### Send Message

```javascript
socket.emit('chat-send-message', {
  conversationId: 'conv_123',
  content: 'Hello, how can I help you?',
  messageType: 'TEXT',
});

socket.on('chat-new-message', (data) => {
  displayMessage(data.message);
});
```

#### Typing Indicators

```javascript
let typingTimeout;

// Start typing
socket.emit('chat-typing', {
  conversationId: 'conv_123',
  isTyping: true,
});

// Stop typing after 1 second of inactivity
clearTimeout(typingTimeout);
typingTimeout = setTimeout(() => {
  socket.emit('chat-typing', {
    conversationId: 'conv_123',
    isTyping: false,
  });
}, 1000);

// Listen for typing events
socket.on('chat-user-typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userId);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

#### Message Status Updates

```javascript
socket.emit('chat-update-message-status', {
  messageId: 'msg_123',
  status: 'READ',
});

socket.on('chat-message-status-updated', (data) => {
  updateMessageStatus(data.messageId, data.status);
});
```

## API Usage Examples

### Start Conversation (Provider -> Customer)

```javascript
const response = await fetch('/api/provider-customer-chat/conversations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    providerId: 1,
    customerId: 2,
    orderId: 123, // Optional
  }),
});
```

### Get User Conversations

```javascript
const conversations = await fetch('/api/provider-customer-chat/conversations', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Get Message History

```javascript
const messages = await fetch('/api/provider-customer-chat/conversations/conv_123/messages?page=1&limit=50', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Security Features

### Authentication

- JWT token verification for REST API endpoints
- Socket.io authentication before chat access
- User authorization checks for conversation access

### Authorization

- Users can only access conversations they participate in
- Provider/customer role verification
- Message sender verification

### Data Protection

- Message content encryption ready (implement as needed)
- User data access logging
- Rate limiting on message sending

## Performance Optimizations

### Database

- Indexed foreign keys for fast lookups
- Pagination for message history
- Efficient conversation queries

### Real-time

- Room-based Socket.io for targeted message delivery
- Debounced typing indicators to reduce server load
- Connection pooling for database operations

### Caching Strategy (Future Enhancement)

- Redis integration for:
  - Online user status
  - Conversation metadata
  - Frequently accessed messages
  - Typing status cache

## Monitoring & Analytics

### Metrics to Track

- Active conversations count
- Messages per conversation
- Average response time
- User engagement rates
- System performance metrics

### Logging

- All chat events are logged with structured logging
- Error tracking and alerting
- Performance monitoring

## Future Enhancements

### File Sharing

- Image and document attachments
- File upload/download endpoints
- Media message types

### Advanced Features

- Message reactions/emojis
- Message forwarding
- Conversation search
- Message encryption
- Push notifications
- Voice messages
- Video calling integration

### Admin Features

- Conversation monitoring
- Content moderation
- Automated responses
- Chat analytics dashboard

## Testing

### Unit Tests

```bash
npm test -- --testPathPattern=chat
```

### Integration Tests

```bash
npm run test:integration -- --testPathPattern=chat
```

### Socket.io Testing

Use tools like:

- Socket.io client for testing real-time features
- Postman for API endpoint testing
- Artillery for load testing

## Troubleshooting

### Common Issues

1. **Prisma Client Not Updated**

   - Solution: Run `npx prisma generate`

2. **Socket Connection Issues**

   - Check CORS configuration
   - Verify authentication token
   - Check network connectivity

3. **Messages Not Delivering**
   - Verify user is in conversation room
   - Check database constraints
   - Review Socket.io logs

### Debug Commands

```bash
# Check database schema
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

## Production Deployment

### Environment Variables

```env
# Chat-specific configurations
CHAT_MESSAGE_LIMIT=100
CHAT_TYPING_TIMEOUT=3000
CHAT_MAX_CONNECTIONS_PER_USER=3
```

### Scaling Considerations

- Use Redis adapter for Socket.io clustering
- Database read replicas for message history
- CDN for file attachments
- Load balancer with session affinity

## Support & Documentation

For additional support:

1. Check the API documentation at `/api/docs`
2. Review Socket.io event definitions in TypeScript files
3. Examine test files for usage examples
4. Monitor logs for debugging information

---

**Status**: ✅ Database models created, ✅ REST API ready, ✅ Socket.io handlers ready
**Next Step**: Run `npx prisma generate` to activate full functionality
