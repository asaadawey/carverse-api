import { RequestHandler } from 'express';
import { HTTPResponses } from '@src/interfaces/enums';
import logger from '@src/utils/logger';
import { isDev } from '@src/config/environment';

/**
 * @swagger
 * components:
 *   responses:
 *     NotFound:
 *       description: API endpoint not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: integer
 *                 example: 404
 *               message:
 *                 type: string
 *                 example: "API endpoint not found"
 *               path:
 *                 type: string
 *                 example: "/api/invalid-endpoint"
 *               method:
 *                 type: string
 *                 example: "GET"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:30:00.000Z"
 *               requestId:
 *                 type: string
 *                 example: "req-12345"
 *               availableEndpoints:
 *                 type: object
 *                 description: "Only included in development environment"
 *                 properties:
 *                   documentation:
 *                     type: string
 *                     example: "/api-docs"
 *                   health:
 *                     type: string
 *                     example: "/health"
 *                   authentication:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["/api/login", "/api/register"]
 */

/**
 * Handle 404 Not Found for unmatched API routes
 * This controller is called when no route matches the incoming request
 */
const notFoundController: RequestHandler = (req, res, next) => {
  const requestId = req.headers['req_id'] || req.header('req_id') || '';

  // Log the 404 attempt with details
  logger.warn('API endpoint not found', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId,
    query: req.query,
    headers: {
      origin: req.get('Origin'),
      referer: req.get('Referer'),
    },
  });

  // Log the values of req.path and req.originalUrl for debugging
  logger.debug('Request path and originalUrl', {
    path: req.path,
    originalUrl: req.originalUrl,
  });

  // Log raw request URL and headers for debugging
  logger.debug('Raw request details', {
    rawUrl: req.url,
    headers: req.headers,
  });

  // Set request ID header if not already set
  if (!res.headersSent) {
    res.setHeader('req_id', requestId);
  }

  // Decode the original URL to preserve special characters
  const decodedPath = decodeURIComponent(req.originalUrl.split('?')[0]);

  // Prepare base response
  const response: any = {
    status: HTTPResponses.NotFound,
    message: 'API endpoint not found',
    path: decodedPath, // Use the decoded path
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Only include available endpoints in development environment
  if (isDev) {
    response.availableEndpoints = {
      documentation: '/api-docs',
      health: '/health',
      authentication: ['/api/login', '/api/register'],
      users: ['/api/getUserDetails', '/api/checkUserExist'],
      orders: ['/api/orders/add', '/api/orders/one/:id'],
      providers: ['/api/providers', '/api/providers/one/:id'],
      cars: ['/api/cars', '/api/cars/add'],
      services: ['/api/services/:moduleId'],
      packages: ['/api/packages/:moduleId'],
    };
  }

  // Send structured 404 response
  res.status(HTTPResponses.NotFound).json(response);
};

export default notFoundController;
