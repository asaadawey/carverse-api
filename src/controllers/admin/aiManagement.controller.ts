import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { getAIPerformanceInsights, updateDailyMetrics } from '@src/utils/aiService';
import * as yup from 'yup';

//#region GetAIInsights
type GetAIInsightsRequestParams = {};

type GetAIInsightsRequestBody = {};

type GetAIInsightsResponse = {
  summary: {
    periodDays: number;
    averageRating: number;
    totalConversations: number;
    averageEscalationRate: number;
  };
  trends: {
    ratingTrend: { date: Date; rating: number }[];
    conversationTrend: { date: Date; count: number }[];
  };
  commonIssues: { issue: string; frequency: number }[];
  recommendations: string[];
};

type GetAIInsightsRequestQuery = {
  days?: string;
};

export const getAIInsightsSchema: yup.SchemaOf<{
  query: GetAIInsightsRequestQuery;
}> = yup.object({
  query: yup.object().shape({
    days: yup.string().optional(),
  }),
});

const getAIInsights: RequestHandler<
  GetAIInsightsRequestParams,
  GetAIInsightsResponse,
  GetAIInsightsRequestBody,
  GetAIInsightsRequestQuery
> = async (req, res, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;

    const insights = await getAIPerformanceInsights(req.prisma, days);

    createSuccessResponse(req, res, insights, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

//#region UpdateMetrics
type UpdateMetricsRequestParams = {};
type UpdateMetricsRequestBody = {};
type UpdateMetricsResponse = { success: boolean; message: string };
type UpdateMetricsRequestQuery = {};

export const updateMetricsSchema: yup.SchemaOf<{}> = yup.object({});

const updateMetrics: RequestHandler<
  UpdateMetricsRequestParams,
  UpdateMetricsResponse,
  UpdateMetricsRequestBody,
  UpdateMetricsRequestQuery
> = async (req, res, next) => {
  try {
    await updateDailyMetrics(req.prisma);

    const response: UpdateMetricsResponse = {
      success: true,
      message: 'Daily metrics updated successfully',
    };

    createSuccessResponse(req, res, response, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

//#region GetTrainingData
type GetTrainingDataRequestParams = {};
type GetTrainingDataRequestBody = {};
type GetTrainingDataResponse = {
  totalFeedback: number;
  averageRating: number;
  helpfulResponsesPercent: number;
  recentFeedback: any[];
};
type GetTrainingDataRequestQuery = {
  limit?: string;
};

export const getTrainingDataSchema: yup.SchemaOf<{
  query: GetTrainingDataRequestQuery;
}> = yup.object({
  query: yup.object().shape({
    limit: yup.string().optional(),
  }),
});

const getTrainingData: RequestHandler<
  GetTrainingDataRequestParams,
  GetTrainingDataResponse,
  GetTrainingDataRequestBody,
  GetTrainingDataRequestQuery
> = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    // Get recent training data
    const recentFeedback = await req.prisma.aiTrainingData.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary statistics
    const totalFeedback = await req.prisma.aiTrainingData.count();

    const allRatings = await req.prisma.aiTrainingData.findMany({
      select: {
        userRating: true,
        wasHelpful: true,
      },
    });

    const averageRating =
      allRatings.length > 0 ? allRatings.reduce((sum, r) => sum + r.userRating, 0) / allRatings.length : 0;

    const helpfulResponsesPercent =
      allRatings.length > 0 ? (allRatings.filter((r) => r.wasHelpful).length / allRatings.length) * 100 : 0;

    const response: GetTrainingDataResponse = {
      totalFeedback,
      averageRating: Math.round(averageRating * 100) / 100,
      helpfulResponsesPercent: Math.round(helpfulResponsesPercent * 100) / 100,
      recentFeedback,
    };

    createSuccessResponse(req, res, response, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export { getAIInsights, updateMetrics, getTrainingData };
