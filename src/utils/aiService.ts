import OpenAI from 'openai';
import logger from '@src/utils/logger';
import { PrismaClient } from '@prisma/client';
import { spreadPaginationParams } from '@src/interfaces/express.types';

/**
 * AI Service for processing chat messages and generating responses
 * Integrated with OpenAI for intelligent conversation handling and API calls
 * Features continuous learning through conversation feedback
 */

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  response: string;
  intent: string;
  confidence: number;
  extractedData?: any;
  suggestions?: string[];
  needsHumanAssistance?: boolean;
  actionTaken?: string;
  apiData?: any;
  trainingData?: {
    conversationId: string;
    effectiveResponse: boolean;
    userSatisfaction?: number;
    improvementSuggestions?: string[];
  };
}

export interface ChatContext {
  userId: number;
  sessionId: number;
  conversationHistory: AIMessage[];
  userProfile?: {
    cars?: any[];
    preferences?: any;
    location?: { latitude: number; longitude: number };
  };
  serviceContext?: {
    moduleId?: number;
    interestedServices?: number[];
  };
  prisma?: PrismaClient;
  paginationParams?: {
    take?: string;
    skip?: string;
  };
}

// Location extraction interface
interface ExtractedLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  area?: string;
}

// Training feedback interface
export interface TrainingFeedback {
  conversationId: string;
  messageId: string;
  userRating: number; // 1-5 scale
  wasHelpful: boolean;
  improvementAreas?: string[];
  correctResponse?: string;
  context: ChatContext;
}

/**
 * Save training feedback to improve model responses
 */
export async function saveTrainingFeedback(
  feedback: TrainingFeedback,
  prisma: PrismaClient
): Promise<void> {
  try {
    // Save to database for model training
    await prisma.aiTrainingData.create({
      data: {
        conversationId: feedback.conversationId,
        messageId: feedback.messageId,
        userRating: feedback.userRating,
        wasHelpful: feedback.wasHelpful,
        improvementAreas: feedback.improvementAreas || [],
        correctResponse: feedback.correctResponse,
        contextData: JSON.stringify(feedback.context),
        createdAt: new Date(),
      },
    });

    // Log for analysis
    logger.info('Training feedback saved', {
      conversationId: feedback.conversationId,
      rating: feedback.userRating,
      helpful: feedback.wasHelpful,
    });

    // If we have a correct response, we can use it for fine-tuning
    if (feedback.correctResponse && feedback.userRating >= 4) {
      await savePositiveTrainingExample(feedback, prisma);
    }
  } catch (error) {
    logger.error('Error saving training feedback', { error, feedback });
  }
}

/**
 * Save positive training examples for model improvement
 */
async function savePositiveTrainingExample(
  feedback: TrainingFeedback,
  prisma: PrismaClient
): Promise<void> {
  try {
    await prisma.aiPositiveExamples.create({
      data: {
        userMessage: feedback.context.conversationHistory.slice(-2)[0]?.content || '',
        correctResponse: feedback.correctResponse!,
        context: JSON.stringify(feedback.context),
        rating: feedback.userRating,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error saving positive training example', { error });
  }
}

/**
 * Update daily performance metrics for AI training analysis
 */
export async function updateDailyMetrics(prisma: PrismaClient): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's conversation data
    const todayData = await prisma.aiTrainingData.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (todayData.length === 0) return;

    const totalConversations = new Set(todayData.map(d => d.conversationId)).size;
    const averageRating = todayData.reduce((sum, d) => sum + d.userRating, 0) / todayData.length;
    const helpfulResponsesCount = todayData.filter(d => d.wasHelpful).length;
    const escalationRate = todayData.filter(d => d.improvementAreas.length > 0).length / todayData.length * 100;

    // Get common failure points
    const allImprovements = todayData.flatMap(d => d.improvementAreas);
    const improvementCounts: { [key: string]: number } = {};
    allImprovements.forEach(improvement => {
      improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
    });
    const commonFailurePoints = Object.entries(improvementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([improvement]) => improvement);

    // Upsert daily metrics
    await prisma.aiPerformanceMetrics.upsert({
      where: { date: today },
      update: {
        totalConversations,
        averageRating,
        helpfulResponsesCount,
        escalationRate,
        commonFailurePoints,
      },
      create: {
        date: today,
        totalConversations,
        averageRating,
        helpfulResponsesCount,
        escalationRate,
        commonFailurePoints,
      },
    });

    logger.info('Daily AI metrics updated', {
      date: today.toISOString().split('T')[0],
      totalConversations,
      averageRating: Math.round(averageRating * 100) / 100,
      helpfulResponsesCount,
      escalationRate: Math.round(escalationRate * 100) / 100,
    });

  } catch (error) {
    logger.error('Error updating daily metrics', { error });
  }
}

/**
 * Get AI performance insights for model improvement
 */
export async function getAIPerformanceInsights(
  prisma: PrismaClient,
  days: number = 30
): Promise<any> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const metrics = await prisma.aiPerformanceMetrics.findMany({
      where: {
        date: {
          gte: since,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (metrics.length === 0) {
      return {
        summary: 'No performance data available',
        recommendations: ['Start collecting training data', 'Ensure proper logging is enabled'],
      };
    }

    const avgRating = metrics.reduce((sum, m) => sum + m.averageRating, 0) / metrics.length;
    const avgEscalationRate = metrics.reduce((sum, m) => sum + m.escalationRate, 0) / metrics.length;
    const totalConversations = metrics.reduce((sum, m) => sum + m.totalConversations, 0);
    
    // Get most common failure points
    const allFailurePoints = metrics.flatMap(m => m.commonFailurePoints);
    const failureCounts: { [key: string]: number } = {};
    allFailurePoints.forEach(point => {
      failureCounts[point] = (failureCounts[point] || 0) + 1;
    });
    const topFailurePoints = Object.entries(failureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([point, count]) => ({ issue: point, frequency: count }));

    const recommendations: string[] = [];
    if (avgRating < 3.5) {
      recommendations.push('Focus on improving response quality and accuracy');
    }
    if (avgEscalationRate > 20) {
      recommendations.push('Reduce human escalation by improving AI capabilities');
    }
    if (topFailurePoints.length > 0) {
      recommendations.push(`Address common issues: ${topFailurePoints[0].issue}`);
    }

    return {
      summary: {
        periodDays: days,
        averageRating: Math.round(avgRating * 100) / 100,
        totalConversations,
        averageEscalationRate: Math.round(avgEscalationRate * 100) / 100,
      },
      trends: {
        ratingTrend: metrics.slice(-7).map(m => ({ date: m.date, rating: m.averageRating })),
        conversationTrend: metrics.slice(-7).map(m => ({ date: m.date, count: m.totalConversations })),
      },
      commonIssues: topFailurePoints,
      recommendations,
    };

  } catch (error) {
    logger.error('Error getting AI performance insights', { error });
    return {
      summary: 'Error retrieving performance data',
      recommendations: ['Check database connection', 'Verify logging configuration'],
    };
  }
}

/**
 * Process user message and generate AI response with training data collection
 */
export async function processMessage(
  message: string,
  context: ChatContext
): Promise<AIResponse> {
  try {
    // Try OpenAI first, fallback to rules if it fails
    let response: AIResponse;
    
    if (process.env.OPENAI_API_KEY) {
      response = await processWithOpenAI(message, context);
    } else {
      logger.warn('OpenAI API key not found, using rule-based responses');
      response = await processWithRules(message, context);
    }

    // Add training data tracking
    response.trainingData = {
      conversationId: context.sessionId.toString(),
      effectiveResponse: true,
      userSatisfaction: response.confidence >= 0.8 ? 4 : 3,
    };

    // Log interaction for learning
    if (context.prisma) {
      await logInteractionForTraining(message, response, context);
    }

    return response;
  } catch (error) {
    logger.error('Error processing AI message with OpenAI, falling back to rules', { error, context });
    
    const fallbackResponse = await processWithRules(message, context);
    fallbackResponse.trainingData = {
      conversationId: context.sessionId.toString(),
      effectiveResponse: false,
      userSatisfaction: 2,
      improvementSuggestions: ['Improve OpenAI integration reliability', 'Better error handling'],
    };

    return fallbackResponse;
  }
}

/**
 * Log interaction for training purposes
 */
async function logInteractionForTraining(
  userMessage: string,
  aiResponse: AIResponse,
  context: ChatContext
): Promise<void> {
  try {
    if (!context.prisma) return;

    // Save interaction for training analysis
    await context.prisma.aiTrainingData.create({
      data: {
        conversationId: context.sessionId.toString(),
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userRating: aiResponse.trainingData?.userSatisfaction || 3,
        wasHelpful: aiResponse.confidence >= 0.7,
        improvementAreas: aiResponse.trainingData?.improvementSuggestions || [],
        contextData: JSON.stringify({
          userMessage,
          intent: aiResponse.intent,
          confidence: aiResponse.confidence,
          actionTaken: aiResponse.actionTaken,
          needsHumanAssistance: aiResponse.needsHumanAssistance,
        }),
        createdAt: new Date(),
      },
    });

    // If it's a high-quality response, save as positive example
    if (aiResponse.confidence >= 0.9 && aiResponse.trainingData?.userSatisfaction && aiResponse.trainingData.userSatisfaction >= 4) {
      await context.prisma.aiPositiveExamples.create({
        data: {
          userMessage,
          correctResponse: aiResponse.response,
          context: JSON.stringify(context),
          rating: aiResponse.trainingData.userSatisfaction,
          createdAt: new Date(),
        },
      });
    }
  } catch (error) {
    logger.error('Error logging interaction for training', { error });
  }
}

/**
 * OpenAI integration for intelligent responses with API calling capabilities
 */
export async function processWithOpenAI(
  message: string,
  context: ChatContext
): Promise<AIResponse> {
  try {
    const systemPrompt = createSystemPrompt(context);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...context.conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
      functions: [
        {
          name: "classify_intent",
          description: "Classify the user's intent and extract relevant data",
          parameters: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                enum: ["service_inquiry", "price_inquiry", "booking_intent", "location_inquiry", "support_request", "greeting", "general"]
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1
              },
              extractedData: {
                type: "object",
                properties: {
                  carType: { type: "string" },
                  serviceType: { type: "string" },
                  timePreference: { type: "string" },
                  location: {
                    type: "object",
                    properties: {
                      latitude: { type: "number" },
                      longitude: { type: "number" },
                      address: { type: "string" },
                      city: { type: "string" },
                      area: { type: "string" }
                    }
                  }
                }
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
                maxItems: 4
              },
              needsHumanAssistance: {
                type: "boolean"
              }
            },
            required: ["intent", "confidence"]
          }
        },
        {
          name: "get_previous_locations",
          description: "Get user's previous order locations/addresses",
          parameters: {
            type: "object",
            properties: {
              reason: { type: "string", description: "Why this function is being called" }
            },
            required: ["reason"]
          }
        },
        {
          name: "get_all_modules",
          description: "Get all available service modules/categories",
          parameters: {
            type: "object",
            properties: {
              reason: { type: "string", description: "Why this function is being called" }
            },
            required: ["reason"]
          }
        },
        {
          name: "get_provider_services",
          description: "Get services available from providers in a module",
          parameters: {
            type: "object",
            properties: {
              moduleId: { type: "number", description: "Module ID to get services for" },
              reason: { type: "string", description: "Why this function is being called" }
            },
            required: ["moduleId", "reason"]
          }
        },
        {
          name: "extract_location_from_text",
          description: "Extract location information from user's text",
          parameters: {
            type: "object",
            properties: {
              locationText: { type: "string", description: "The location text to parse" },
              reason: { type: "string", description: "Why this function is being called" }
            },
            required: ["locationText", "reason"]
          }
        }
      ],
      function_call: "auto"
    });

    const responseMessage = completion.choices[0].message;
    let aiResponse: AIResponse;

    if (responseMessage.function_call) {
      // Handle function calls
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);
      
      switch (functionName) {
        case "get_previous_locations":
          return await handleGetPreviousLocations(context, functionArgs.reason);
          
        case "get_all_modules":
          return await handleGetAllModules(context, functionArgs.reason);
          
        case "get_provider_services":
          return await handleGetProviderServices(context, functionArgs.moduleId, functionArgs.reason);
          
        case "extract_location_from_text":
          return await handleExtractLocation(message, context, functionArgs.locationText, functionArgs.reason);
          
        case "classify_intent":
        default:
          aiResponse = {
            response: responseMessage.content || generateResponseForIntent(functionArgs.intent, functionArgs.extractedData, context),
            intent: functionArgs.intent,
            confidence: functionArgs.confidence,
            extractedData: functionArgs.extractedData || {},
            suggestions: functionArgs.suggestions || generateSuggestions(functionArgs.intent, context),
            needsHumanAssistance: functionArgs.needsHumanAssistance || false
          };
          break;
      }
    } else {
      // Regular response without function call
      const extractedData = extractEntities(message);
      const intent = classifyIntent(message);
      
      aiResponse = {
        response: responseMessage.content || "I'm here to help you with our car wash services.",
        intent: intent,
        confidence: 0.8,
        extractedData: extractedData,
        suggestions: generateSuggestions(intent, context),
        needsHumanAssistance: false
      };
    }

    return aiResponse;

  } catch (error) {
    logger.error('OpenAI processing failed, falling back to rules', { error });
    throw error; // Let the main function handle fallback
  }
}

/**
 * Create system prompt for OpenAI based on context
 */
function createSystemPrompt(context: ChatContext): string {
  let prompt = `You are a helpful AI assistant for a car wash service platform. Your role is to help customers find services, get pricing information, book appointments, and provide support.

Platform Information:
- We offer various car wash services: basic wash, premium detailing, full-service packages
- Services are provided by multiple providers in different locations
- Pricing varies based on car body type (sedan, SUV, truck, etc.)
- We have an auto-select feature to find the best provider automatically

Your Capabilities:
- Help customers find suitable car wash services
- Provide pricing information based on car type
- Assist with booking appointments
- Find providers in customer's area
- Escalate complex issues to human support

Response Guidelines:
- Be friendly, helpful, and professional
- Keep responses concise but informative
- Always provide 2-4 relevant suggestions for next actions
- Ask for missing information when needed (car type, location, etc.)
- Escalate to human support for complaints, refunds, or complex issues

`;

  // Add user context if available
  if (context.userProfile?.cars && context.userProfile.cars.length > 0) {
    prompt += `\nCustomer Information:
- Customer has ${context.userProfile.cars.length} registered vehicle(s)
- Car types: ${context.userProfile.cars.map((car: any) => car.bodyType || 'unknown').join(', ')}`;
  }

  if (context.serviceContext?.moduleId) {
    prompt += `\n- Customer is in module/area ID: ${context.serviceContext.moduleId}`;
  }

  prompt += `\nImportant: Always classify the customer's intent and provide appropriate suggestions for their next actions.`;

  return prompt;
}

/**
 * Handler for getting user's previous locations - aligned with getPreviousAddresses controller
 */
async function handleGetPreviousLocations(context: ChatContext, reason: string): Promise<AIResponse> {
  try {
    if (!context.prisma) {
      throw new Error('Database connection not available');
    }

    // Use same implementation as getPreviousAddresses controller
    const addresses = await context.prisma.orders.findMany({
      distinct: ['AddressString'],
      select: {
        AddressString: true,
        Latitude: true,
        Longitude: true,
        AdditionalAddressData: true,
      },
      where: {
        customer: {
          UserID: { equals: context.userId },
        },
      },
      ...spreadPaginationParams(context.paginationParams || { take: "10" }),
    });

    if (addresses.length === 0) {
      return {
        response: "I don't see any previous addresses in your account. Would you like to enter a new address for your car wash service?",
        intent: "location_inquiry",
        confidence: 1.0,
        suggestions: ["Enter new address", "Use current location", "Skip for now"],
        actionTaken: "Retrieved previous locations (none found)",
        trainingData: {
          conversationId: context.sessionId.toString(),
          effectiveResponse: true,
          userSatisfaction: 4,
        }
      };
    }

    const addressList = addresses.map((addr, index) => 
      `${index + 1}. ${addr.AddressString}`
    ).join('\n');

    return {
      response: `Here are your previous addresses:\n\n${addressList}\n\nWould you like to use one of these locations, or enter a new address?`,
      intent: "location_inquiry",
      confidence: 1.0,
      suggestions: ["Use address #1", "Use address #2", "Enter new address", "Show more details"],
      actionTaken: "Retrieved previous locations",
      apiData: addresses,
      trainingData: {
        conversationId: context.sessionId.toString(),
        effectiveResponse: true,
        userSatisfaction: 4,
      }
    };

  } catch (error) {
    logger.error('Error getting previous locations', { error, context });
    return {
      response: "I'm having trouble accessing your previous addresses. Would you like to enter a new address?",
      intent: "location_inquiry",
      confidence: 1.0,
      suggestions: ["Enter new address", "Use current location", "Try again"],
      needsHumanAssistance: true,
      trainingData: {
        conversationId: context.sessionId.toString(),
        effectiveResponse: false,
        userSatisfaction: 2,
        improvementSuggestions: ["Improve error handling", "Better database connection management"],
      }
    };
  }
}

/**
 * Handler for getting all available modules - aligned with getAllModules controller
 */
async function handleGetAllModules(context: ChatContext, reason: string): Promise<AIResponse> {
  try {
    if (!context.prisma) {
      throw new Error('Database connection not available');
    }

    // Use same implementation as getAllModules controller
    const modules = await context.prisma.modules.findMany({
      ...spreadPaginationParams(context.paginationParams || {}),
      where: { isActive: { equals: true } },
      select: { id: true, ModuleName: true, ModuleDescription: true, ModuleIconLink: true },
    });

    if (modules.length === 0) {
      return {
        response: "I'm sorry, but no service modules are currently available. Please contact support for assistance.",
        intent: "support_request",
        confidence: 1.0,
        suggestions: ["Contact support", "Try again later"],
        needsHumanAssistance: true,
        trainingData: {
          conversationId: context.sessionId.toString(),
          effectiveResponse: false,
          userSatisfaction: 2,
          improvementSuggestions: ["Provide alternative when no modules available"],
        }
      };
    }

    // Check if user mentioned car wash specifically
    const carWashModule = modules.find(module => 
      module.ModuleName.toLowerCase().includes('wash') || 
      module.ModuleName.toLowerCase().includes('car') ||
      module.ModuleDescription.toLowerCase().includes('wash')
    );

    if (carWashModule) {
      // Update service context
      if (context.serviceContext) {
        context.serviceContext.moduleId = carWashModule.id;
      }

      return {
        response: `Perfect! I found our ${carWashModule.ModuleName} service. This includes ${carWashModule.ModuleDescription}. Would you like to see available services and providers for car washing?`,
        intent: "service_inquiry",
        confidence: 1.0,
        suggestions: ["Yes, show services", "See other modules", "Get pricing", "Find providers nearby"],
        actionTaken: "Auto-selected car wash module",
        apiData: { selectedModule: carWashModule, allModules: modules },
        trainingData: {
          conversationId: context.sessionId.toString(),
          effectiveResponse: true,
          userSatisfaction: 5,
        }
      };
    }

    const moduleList = modules.map((module, index) => 
      `${index + 1}. ${module.ModuleName} - ${module.ModuleDescription}`
    ).join('\n');

    return {
      response: `Here are our available service modules:\n\n${moduleList}\n\nWhich service are you interested in?`,
      intent: "service_inquiry",
      confidence: 1.0,
      suggestions: modules.slice(0, 3).map(m => `Select ${m.ModuleName}`),
      actionTaken: "Retrieved all modules",
      apiData: modules,
      trainingData: {
        conversationId: context.sessionId.toString(),
        effectiveResponse: true,
        userSatisfaction: 4,
      }
    };

  } catch (error) {
    logger.error('Error getting modules', { error, context });
    return {
      response: "I'm having trouble accessing our service modules. Please try again or contact support.",
      intent: "support_request",
      confidence: 1.0,
      suggestions: ["Try again", "Contact support"],
      needsHumanAssistance: true,
      trainingData: {
        conversationId: context.sessionId.toString(),
        effectiveResponse: false,
        userSatisfaction: 2,
        improvementSuggestions: ["Better error handling for module retrieval"],
      }
    };
  }
}

/**
 * Handler for getting provider services for a specific module - aligned with getAllProviderServices controller
 */
async function handleGetProviderServices(context: ChatContext, moduleId: number, reason: string): Promise<AIResponse> {
  try {
    if (!context.prisma) {
      throw new Error('Database connection not available');
    }

    // Use same implementation as getAllProviderServices controller
    const data = await context.prisma.providerServices.findMany({
      where: {
        AND: [
          { services: { ModuleID: { equals: moduleId } } },
          { services: { IsActive: true } },
          { services: { isAvailableForAutoSelect: true } },
        ],
      },
      ...spreadPaginationParams(context.paginationParams || {}),
      include: {
        providerServicesAllowedBodyTypes: {
          include: {
            bodyType: true,
          },
        },
        services: true,
        provider: {
          select: {
            id: true,
            users: {
              select: {
                FirstName: true,
                LastName: true,
              },
            },
          },
        },
      },
    });

    if (data.length === 0) {
      return {
        response: "I don't see any available services for this module right now. Would you like to check other service categories or contact support?",
        intent: "service_inquiry",
        confidence: 1.0,
        suggestions: ["Check other services", "Contact support", "Try again later"],
        needsHumanAssistance: true,
        trainingData: {
          conversationId: context.sessionId.toString(),
          effectiveResponse: false,
          userSatisfaction: 2,
          improvementSuggestions: ["Suggest alternative modules when services unavailable"],
        }
      };
    }

    // Transform data to include price calculations - same as controller
    const transformedData = data.map((providerService) => {
      if (!providerService.services) {
        return {
          ...providerService,
          services: null,
        };
      }

      // Calculate price statistics from providerServicesAllowedBodyTypes
      const prices = providerService.providerServicesAllowedBodyTypes.map(bodyType => Number(bodyType.Price));
      
      let minimumServicePrice = 0;
      let maximumServicePrice = 0;
      let averageServicePrice = 0;

      if (prices.length > 0) {
        minimumServicePrice = Math.min(...prices);
        maximumServicePrice = Math.max(...prices);
        averageServicePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      }

      return {
        ...providerService,
        services: {
          ...providerService.services,
          isAvailableForAutoSelect: providerService.services.isAvailableForAutoSelect,
          minimumServicePrice,
          maximumServicePrice,
          averageServicePrice: Math.round(averageServicePrice * 100) / 100, // Round to 2 decimal places
        },
      };
    });

    const serviceList = transformedData.map((service, index) => {
      const serviceName = service.services?.ServiceName || 'Unknown Service';
      const minPrice = service.services?.minimumServicePrice || 0;
      const maxPrice = service.services?.maximumServicePrice || 0;
      const providerName = service.provider?.users?.[0] 
        ? `${service.provider.users[0].FirstName} ${service.provider.users[0].LastName}`.trim()
        : 'Unknown Provider';
      
      return `${index + 1}. ${serviceName} by ${providerName} - $${minPrice}-${maxPrice}`;
    }).join('\n');

    return {
      response: `Here are the available services with pricing:\n\n${serviceList}\n\nWhich service would you like to book? I can help you find providers in your area.`,
      intent: "booking_intent",
      confidence: 1.0,
      suggestions: transformedData.slice(0, 3).map(s => `Book ${s.services?.ServiceName || 'Service'}`),
      actionTaken: "Retrieved provider services with pricing",
      apiData: transformedData,
      trainingData: {
        conversationId: context.sessionId.toString(),
        effectiveResponse: true,
        userSatisfaction: 4,
      }
    };

  } catch (error) {
    logger.error('Error getting provider services', { error, context, moduleId });
    return {
      response: "I'm having trouble accessing services for this category. Please try again or contact support.",
      intent: "support_request",
      confidence: 1.0,
      suggestions: ["Try again", "Choose different service", "Contact support"],
      needsHumanAssistance: true,
      trainingData: {
        conversationId: context.sessionId.toString(),
        effectiveResponse: false,
        userSatisfaction: 2,
        improvementSuggestions: ["Better error handling for service retrieval", "Fallback options"],
      }
    };
  }
}

/**
 * Handler for extracting location from text
 */
async function handleExtractLocation(message: string, context: ChatContext, locationText: string, reason: string): Promise<AIResponse> {
  try {
    // Basic location extraction (can be enhanced with geocoding APIs)
    const extractedLocation = parseLocationFromText(locationText);
    
    if (extractedLocation.address || extractedLocation.city) {
      return {
        response: `I found the location: ${extractedLocation.address || extractedLocation.city}. Is this correct? I can help you find car wash providers in this area.`,
        intent: "location_inquiry",
        confidence: 0.9,
        extractedData: { location: extractedLocation },
        suggestions: ["Yes, that's correct", "No, different location", "Use GPS location", "Enter exact address"],
        actionTaken: "Extracted location from text"
      };
    } else {
      return {
        response: "I'm having trouble understanding the location. Could you please provide a more specific address, city name, or area?",
        intent: "location_inquiry",
        confidence: 0.7,
        suggestions: ["Enter full address", "Name the city", "Use current location", "Share GPS coordinates"],
        actionTaken: "Failed to extract location"
      };
    }

  } catch (error) {
    logger.error('Error extracting location', { error, locationText });
    return {
      response: "I'm having trouble processing the location. Could you please provide the address in a different format?",
      intent: "location_inquiry",
      confidence: 0.6,
      suggestions: ["Try different format", "Use current location", "Contact support"],
      needsHumanAssistance: true
    };
  }
}

/**
 * Parse location information from text
 */
function parseLocationFromText(text: string): ExtractedLocation {
  const location: ExtractedLocation = {};
  const lowerText = text.toLowerCase();

  // Look for common location indicators
  const addressPatterns = [
    /(\d+\s+[a-zA-Z\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd))/i,
    /([a-zA-Z\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd))/i,
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      location.address = match[1].trim();
      break;
    }
  }

  // Look for city names (basic implementation)
  const cityKeywords = ['city', 'downtown', 'center', 'mall', 'plaza'];
  for (const keyword of cityKeywords) {
    if (lowerText.includes(keyword)) {
      const words = text.split(/\s+/);
      const keywordIndex = words.findIndex(word => word.toLowerCase().includes(keyword));
      if (keywordIndex > 0) {
        location.city = words[keywordIndex - 1] + ' ' + words[keywordIndex];
      }
      break;
    }
  }

  // Look for area names
  if (!location.address && !location.city) {
    location.area = text.trim();
  }

  return location;
}

/**
 * Generate response based on intent (helper function)
 */
function generateResponseForIntent(intent: string, extractedData: any, context: ChatContext): string {
  switch (intent) {
    case 'service_inquiry':
      return "Great! I can help you find the perfect car wash service. We offer various packages including basic wash, premium detailing, and full-service options. What type of service are you most interested in?";
    
    case 'price_inquiry':
      return "Our pricing varies based on your car type and the services you choose. Basic wash starts from $15, while premium packages can go up to $50. Would you like me to show you specific pricing for your car?";
    
    case 'location_inquiry':
      return "I can help you find providers in your area! We have providers available throughout the city. Would you like me to show you providers near your current location or a specific address?";
    
    case 'booking_intent':
      return "Perfect! I can help you book a service right now. I can either help you choose from available providers or use our auto-select feature to find the best provider near you. Which would you prefer?";
    
    case 'support_request':
      return "I'm sorry to hear you're having an issue. I can connect you with our human support team who will be better able to assist you with your concern. Would you like me to transfer you now?";
    
    case 'greeting':
      return "Hello! I'm here to help you with our car wash services. How can I assist you today?";
    
    default:
      return "I'm here to help you with our car wash services! I can help you find services, check pricing, locate providers, or book an appointment. What would you like to know more about?";
  }
}

/**
 * Simple intent classification for fallback
 */
function classifyIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('wash') || lowerMessage.includes('clean') || lowerMessage.includes('service')) {
    return 'service_inquiry';
  }
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
    return 'price_inquiry';
  }
  if (lowerMessage.includes('book') || lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
    return 'booking_intent';
  }
  if (lowerMessage.includes('location') || lowerMessage.includes('near') || lowerMessage.includes('where')) {
    return 'location_inquiry';
  }
  if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('complaint')) {
    return 'support_request';
  }
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return 'greeting';
  }
  
  return 'general';
}

/**
 * Rule-based message processing (fallback when OpenAI is unavailable)
 */
async function processWithRules(message: string, context: ChatContext): Promise<AIResponse> {
  const lowerMessage = message.toLowerCase();
  let intent = classifyIntent(message);
  let confidence = 0.8;
  let response = '';
  let suggestions: string[] = [];
  let extractedData: any = extractEntities(message);
  let needsHumanAssistance = false;

  // Generate response based on intent
  switch (intent) {
    case 'service_inquiry':
      response = "I can help you find the perfect car wash service! What type of service are you looking for? We offer basic wash, premium detailing, and full-service packages.";
      suggestions = [
        "Tell me about basic wash",
        "What's included in premium detailing?",
        "Show me all packages",
        "Find providers near me"
      ];
      break;
      
    case 'price_inquiry':
      if (!context.userProfile?.cars || context.userProfile.cars.length === 0) {
        response = "To give you accurate pricing, I need to know about your car. What type of vehicle do you have?";
        suggestions = ["Add my car details", "Show general pricing"];
      } else {
        response = "Based on your car, here are our pricing options. Basic wash starts at $15, premium service at $35, and full detail at $50.";
        suggestions = ["Book basic wash", "Learn about premium", "Compare all options"];
      }
      break;
      
    case 'booking_intent':
      response = "Great! I can help you book a service. Would you like me to find the best provider for you automatically, or would you prefer to choose from available providers?";
      suggestions = [
        "Auto-select best provider",
        "Show me all providers",
        "Choose service first",
        "Check my location"
      ];
      break;
      
    case 'location_inquiry':
      response = "I can find providers near you! Would you like to use your current location or enter a specific address?";
      suggestions = [
        "Use current location",
        "Enter address",
        "Show all areas we serve"
      ];
      break;
      
    case 'support_request':
      needsHumanAssistance = true;
      response = "I understand you need help with an issue. Let me connect you with our support team who can better assist you.";
      suggestions = [
        "Connect with support",
        "Explain the issue",
        "Check order status"
      ];
      break;
      
    case 'greeting':
      response = "Hello! Welcome to our car wash service. I'm here to help you find the perfect car wash for your vehicle. How can I assist you today?";
      suggestions = [
        "Show me services",
        "Find providers near me",
        "Check pricing",
        "Book a wash"
      ];
      break;
      
    default:
      response = "I'm here to help you with our car wash services! I can help you find services, check pricing, locate providers, or book an appointment. What would you like to know more about?";
      suggestions = [
        "Show available services",
        "Find providers",
        "Check pricing",
        "Book service"
      ];
  }

  return {
    response,
    intent,
    confidence,
    extractedData,
    suggestions,
    needsHumanAssistance,
  };
}

/**
 * Generate contextual suggestions based on conversation state
 */
export function generateSuggestions(intent: string, context: ChatContext): string[] {
  const baseActions = [
    "Show services",
    "Find providers",
    "Check pricing",
    "Book service"
  ];

  switch (intent) {
    case 'service_inquiry':
      return [
        "Tell me about basic wash",
        "What's premium detailing?",
        "Show all packages",
        "Find providers near me"
      ];
    
    case 'price_inquiry':
      return [
        "Show detailed pricing",
        "Compare packages",
        "Book this service",
        "Add my car details"
      ];
    
    case 'booking_intent':
      return [
        "Auto-select provider",
        "Choose provider manually",
        "Select time slot",
        "Review booking details"
      ];
    
    case 'location_inquiry':
      return [
        "Use current location",
        "Enter specific address",
        "Show coverage areas",
        "Find nearest provider"
      ];
    
    default:
      return baseActions;
  }
}

/**
 * Extract entities from user message (basic implementation)
 */
export function extractEntities(message: string): any {
  const entities: any = {};
  const lowerMessage = message.toLowerCase();

  // Extract car types
  const carTypes = ['sedan', 'suv', 'truck', 'hatchback', 'coupe', 'van'];
  for (const type of carTypes) {
    if (lowerMessage.includes(type)) {
      entities.carType = type;
      break;
    }
  }

  // Extract service types
  const serviceTypes = ['basic', 'premium', 'full', 'detail', 'wash'];
  for (const service of serviceTypes) {
    if (lowerMessage.includes(service)) {
      entities.serviceType = service;
      break;
    }
  }

  // Extract time preferences
  const timeKeywords = ['morning', 'afternoon', 'evening', 'today', 'tomorrow'];
  for (const time of timeKeywords) {
    if (lowerMessage.includes(time)) {
      entities.timePreference = time;
      break;
    }
  }

  return entities;
}
