import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import * as yup from 'yup';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPResponses, UserTypes } from '@src/interfaces/enums';
import { paginationSchema, spreadPaginationParams } from '@src/interfaces/express.types';
import { getChatHistory as getSocketChatHistory } from '@src/web-socket/chatSocket';
import { userHasAccessToOrder } from '@src/utils/orderUtils';
import { ChatHistoryResponse } from '@src/types/chat.types';

//#region GetChatHistory
export const getChatHistorySchema: yup.SchemaOf<{
  params: GetChatHistoryRequestParams;
  query: GetChatHistoryRequestQuery;
}> = yup.object({
  params: yup.object({
    orderId: yup.string().required('Order ID is required'),
  }),
  query: paginationSchema,
});

type GetChatHistoryRequestQuery = {
  take?: string;
  skip?: string;
};

type GetChatHistoryRequestBody = {};

export type GetChatHistoryResponse = ChatHistoryResponse;

type GetChatHistoryRequestParams = {
  orderId: string;
};

const getChatHistory: RequestHandler<
  GetChatHistoryRequestParams,
  GetChatHistoryResponse,
  GetChatHistoryRequestBody,
  GetChatHistoryRequestQuery
> = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (req.user.userType !== UserTypes.Admin)
      await userHasAccessToOrder(Number(orderId), req.user, req.prisma, req.language);

    const chat = await getSocketChatHistory(Number(orderId));

    createSuccessResponse(req, res, chat, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getChatHistory;
