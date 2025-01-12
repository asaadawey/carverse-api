import { RequestHandler } from 'express';
import { getAllowedClient } from './allowedClient.middleware';
import { AllowedClients } from '@src/interfaces/enums';

// This function is to take cookie from header and put it inside req.cookie
// It's configured to be used with mobile only
const mobileCookieInjector: RequestHandler = (req, res, next) => {
  const allowedClient = getAllowedClient(req);

  if (allowedClient && allowedClient === AllowedClients.MobileApp) {
    const headerCookie = req.header('cookies');
    try {
      if (headerCookie) req.cookies = { ...req.cookies, ...JSON.parse(headerCookie) };
    } catch {}
  }
  next();
};

export default mobileCookieInjector;
