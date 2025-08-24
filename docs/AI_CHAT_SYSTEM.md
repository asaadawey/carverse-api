# AI Chat Agent System Documentation

## Overview

This chat system provides an intelligent AI agent for customer service interactions in the car wash platform. It includes session management, message processing, intent recognition, and real-time communication capabilities.

## Architecture

### Database Models

The system includes 4 new database models:

1. **chatSessions** - Manages chat sessions between users and AI agent
2. **chatMessages** - Stores all messages in chat sessions
3. **aiAgentIntents** - Tracks AI processing results and intent classification
4. **chatSessions** relationships with existing user and module models

### API Endpoints

#### 1. Start Chat Session

- **Endpoint**: `POST /chat/start`
- **Purpose**: Initialize a new chat session with the AI agent
- **Authentication**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "moduleId": 1 // Optional: specific service module
  }
  ```
- **Response**:
  ```json
  {
    "sessionId": 123,
    "initialMessage": "Hello! I'm here to help...",
    "suggestions": ["Show services", "Find providers", ...]
  }
  ```

#### 2. Send Message

- **Endpoint**: `POST /chat/:sessionId/message`
- **Purpose**: Send a message and receive AI response
- **Authentication**: Required (JWT token)
- **Request Body**:
  ```json
  {
    "message": "I need a car wash service"
  }
  ```
- **Response**:
  ```json
  {
    "userMessage": "I need a car wash service",
    "aiResponse": "I can help you find the perfect service...",
    "intent": "service_inquiry",
    "suggestions": ["Tell me about your car", "Show packages", ...],
    "needsHumanAssistance": false
  }
  ```

#### 3. Get Chat History

- **Endpoint**: `GET /chat/:sessionId/history`
- **Purpose**: Retrieve conversation history for a session
- **Authentication**: Required (JWT token)
- **Response**:
  ```json
  {
    "messages": [
      {
        "id": 1,
        "sender": "ai",
        "message": "Hello! How can I help?",
        "createdAt": "2024-01-15T10:00:00Z"
      },
      ...
    ]
  }
  ```

### WebSocket Events

#### Server to Client Events

- `chat-message-received` - New message in chat session
- `chat-ai-response` - AI response to user message
- `chat-session-updated` - Session status or context update

#### Client to Server Events

- `join-chat-room` - Join a specific chat session room
- `leave-chat-room` - Leave a chat session room
- `chat-send-message` - Send message via WebSocket

### AI Service Features

#### Intent Classification

The AI service can classify user intents:

- `service_inquiry` - Questions about available services
- `price_inquiry` - Pricing and cost questions
- `booking_intent` - Requests to book services
- `location_inquiry` - Location and provider availability
- `support_request` - Issues requiring human assistance
- `greeting` - Initial greetings
- `general` - General questions

#### Entity Extraction

The system extracts key information from messages:

- Car types (sedan, SUV, truck, etc.)
- Service types (basic, premium, full detail)
- Time preferences (morning, afternoon, today, tomorrow)
- Location mentions

#### Context Management

Chat sessions maintain context including:

- User profile and car information
- Conversation history
- Service preferences
- Location data
- Intent history

## Integration with OpenAI

The system is designed to easily integrate with OpenAI's API. To add OpenAI integration:

1. Install OpenAI SDK:

   ```bash
   npm install openai
   ```

2. Update the `aiService.ts` file:

   ```typescript
   import OpenAI from 'openai';

   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });

   export async function processWithOpenAI(message: string, context: ChatContext): Promise<AIResponse> {
     const systemPrompt = `You are a helpful AI assistant for a car wash service platform...`;

     const response = await openai.chat.completions.create({
       model: 'gpt-3.5-turbo',
       messages: [
         { role: 'system', content: systemPrompt },
         ...context.conversationHistory,
         { role: 'user', content: message },
       ],
     });

     // Process response and extract intent, suggestions, etc.
     return parseOpenAIResponse(response);
   }
   ```

3. Add environment variables:
   ```env
   OPENAI_API_KEY=your-openai-api-key
   ```

## Frontend Integration

### REST API Usage

```javascript
// Start chat session
const session = await fetch('/api/chat/start', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ moduleId: 1 }),
});

// Send message
const response = await fetch(`/api/chat/${sessionId}/message`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'I need a car wash' }),
});
```

### WebSocket Integration

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: userToken },
});

// Join chat room
socket.emit('join-chat-room', { sessionId });

// Listen for AI responses
socket.on('chat-ai-response', (data) => {
  console.log('AI Response:', data.message);
  displayMessage(data);
});

// Send message via WebSocket
socket.emit('chat-send-message', {
  sessionId,
  message: 'Hello!',
});
```

## Testing

### Sample Test Cases

1. **Service Inquiry Test**:

   ```
   User: "I need a car wash"
   Expected: service_inquiry intent, service suggestions
   ```

2. **Price Inquiry Test**:

   ```
   User: "How much does it cost?"
   Expected: price_inquiry intent, car type request if no car data
   ```

3. **Booking Test**:
   ```
   User: "I want to book an appointment"
   Expected: booking_intent intent, provider selection options
   ```

### Integration Tests

```javascript
describe('Chat API', () => {
  test('should start chat session', async () => {
    const response = await request(app)
      .post('/api/chat/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ moduleId: 1 });

    expect(response.status).toBe(200);
    expect(response.body.sessionId).toBeDefined();
  });

  test('should process service inquiry', async () => {
    const response = await request(app)
      .post(`/api/chat/${sessionId}/message`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'I need a car wash' });

    expect(response.body.intent).toBe('service_inquiry');
    expect(response.body.suggestions).toHaveLength(4);
  });
});
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/carwash"

# JWT
JWT_SECRET="your-jwt-secret"

# OpenAI (optional)
OPENAI_API_KEY="your-openai-api-key"

# Redis (for WebSocket scaling)
REDIS_URL="redis://localhost:6379"
```

### Prisma Migration

To set up the database schema:

```bash
# Generate migration
npx prisma migrate dev --name add-chat-system

# Generate Prisma client
npx prisma generate
```

## Security Considerations

1. **Authentication**: All chat endpoints require valid JWT tokens
2. **Session Validation**: Users can only access their own chat sessions
3. **Message Validation**: Input validation on all message content
4. **Rate Limiting**: Consider implementing rate limiting for message sending
5. **Data Privacy**: Chat messages should be encrypted at rest

## Monitoring and Logging

The system includes comprehensive logging:

- Message processing events
- AI response generation
- Error tracking
- Performance metrics

Example log entries:

```json
{
  "level": "info",
  "message": "Processing chat message",
  "sessionId": 123,
  "userId": 456,
  "intent": "service_inquiry",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Future Enhancements

1. **Advanced AI Features**:

   - Multi-language support
   - Sentiment analysis
   - Advanced entity extraction
   - Learning from user interactions

2. **Analytics**:

   - Chat session analytics
   - Intent distribution tracking
   - User satisfaction metrics
   - Conversion rate tracking

3. **Integration Features**:

   - CRM integration
   - Email/SMS notifications
   - Calendar integration for bookings
   - Payment processing integration

4. **Performance Optimizations**:
   - Caching frequently asked questions
   - Response pre-generation
   - Message clustering
   - Auto-scaling based on chat volume

## Troubleshooting

### Common Issues

1. **Session Not Found**: Ensure sessionId is valid and belongs to authenticated user
2. **WebSocket Connection Issues**: Check authentication token and network connectivity
3. **AI Response Delays**: Monitor AI service performance and implement fallback responses
4. **Database Connection**: Verify Prisma connection and database availability

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

This will provide detailed logs for troubleshooting chat system issues.
