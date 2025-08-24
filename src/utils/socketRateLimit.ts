// import { Socket } from 'socket.io';
// import { getRedisClient } from './redis';
// import logger from './logger';

// interface ConnectionAttempt {
//   count: number;
//   lastAttempt: number;
//   blocked: boolean;
// }

// // In-memory fallback if Redis is not available
// const memoryStore = new Map<string, ConnectionAttempt>();

// /**
//  * Socket.IO rate limiting middleware
//  * Prevents too many connections from the same IP
//  */
// export class SocketRateLimiter {
//   private windowMs: number;
//   private maxConnections: number;
//   private blockDuration: number;

//   constructor(
//     options: {
//       windowMs?: number; // Time window in milliseconds
//       maxConnections?: number; // Max connections per window
//       blockDuration?: number; // How long to block after exceeding limit
//     } = {},
//   ) {
//     this.windowMs = options.windowMs || 60000; // 1 minute
//     this.maxConnections = options.maxConnections || 10; // 10 connections per minute
//     this.blockDuration = options.blockDuration || 300000; // 5 minutes block
//   }

//   /**
//    * Middleware function for Socket.IO
//    */
//   middleware() {
//     return async (socket: Socket, next: (err?: Error) => void) => {
//       try {
//         const clientIP = this.getClientIP(socket);
//         const allowed = await this.checkRateLimit(clientIP);

//         if (!allowed) {
//           logger.warn('Socket connection rate limited', {
//             ip: clientIP,
//             socketId: socket.id,
//           });
//           return next(new Error('Rate limit exceeded. Too many connection attempts.'));
//         }

//         next();
//       } catch (error: any) {
//         logger.error('Socket rate limiter error:', {
//           error: error.message,
//           socketId: socket.id,
//         });
//         // Allow connection if rate limiter fails
//         next();
//       }
//     };
//   }

//   /**
//    * Check if IP is allowed to connect
//    */
//   private async checkRateLimit(ip: string): Promise<boolean> {
//     try {
//       const redisClient = await getRedisClient();

//       if (redisClient) {
//         return await this.checkRedisRateLimit(redisClient, ip);
//       } else {
//         return this.checkMemoryRateLimit(ip);
//       }
//     } catch (error) {
//       logger.error('Rate limit check failed, allowing connection:', error);
//       return true; // Allow connection if check fails
//     }
//   }

//   /**
//    * Redis-based rate limiting
//    */
//   private async checkRedisRateLimit(redisClient: any, ip: string): Promise<boolean> {
//     const key = `socket_rate_limit:${ip}`;
//     const blockKey = `socket_blocked:${ip}`;
//     const now = Date.now();

//     // Check if IP is currently blocked
//     const blocked = await redisClient.get(blockKey);
//     if (blocked) {
//       return false;
//     }

//     // Get current connection count
//     const pipeline = redisClient.multi();
//     pipeline.zremrangebyscore(key, 0, now - this.windowMs); // Remove old entries
//     pipeline.zcard(key); // Count current entries
//     pipeline.zadd(key, now, `${now}_${Math.random()}`); // Add current attempt
//     pipeline.expire(key, Math.ceil(this.windowMs / 1000)); // Set expiration

//     const results = await pipeline.exec();
//     const currentCount = results[1][1] as number;

//     if (currentCount >= this.maxConnections) {
//       // Block this IP
//       await redisClient.setex(blockKey, Math.ceil(this.blockDuration / 1000), 'blocked');

//       logger.warn('IP blocked due to rate limiting', {
//         ip,
//         connections: currentCount,
//         maxConnections: this.maxConnections,
//       });

//       return false;
//     }

//     return true;
//   }

//   /**
//    * Memory-based rate limiting (fallback)
//    */
//   private checkMemoryRateLimit(ip: string): boolean {
//     const now = Date.now();
//     const attempt = memoryStore.get(ip);

//     if (attempt?.blocked && now - attempt.lastAttempt < this.blockDuration) {
//       return false;
//     }

//     if (!attempt || now - attempt.lastAttempt > this.windowMs) {
//       // Reset or create new attempt record
//       memoryStore.set(ip, {
//         count: 1,
//         lastAttempt: now,
//         blocked: false,
//       });
//       return true;
//     }

//     attempt.count++;
//     attempt.lastAttempt = now;

//     if (attempt.count > this.maxConnections) {
//       attempt.blocked = true;
//       logger.warn('IP blocked due to rate limiting (memory)', {
//         ip,
//         connections: attempt.count,
//         maxConnections: this.maxConnections,
//       });
//       return false;
//     }

//     memoryStore.set(ip, attempt);
//     return true;
//   }

//   /**
//    * Get client IP from socket
//    */
//   private getClientIP(socket: Socket): string {
//     const forwarded = socket.handshake.headers['x-forwarded-for'];
//     if (typeof forwarded === 'string') {
//       return forwarded.split(',')[0].trim();
//     }
//     return socket.handshake.address || 'unknown';
//   }

//   /**
//    * Clean up memory store periodically
//    */
//   static startCleanupInterval() {
//     setInterval(() => {
//       const now = Date.now();
//       const fiveMinutesAgo = now - 300000; // 5 minutes

//       for (const [ip, attempt] of memoryStore.entries()) {
//         if (attempt.lastAttempt < fiveMinutesAgo) {
//           memoryStore.delete(ip);
//         }
//       }
//     }, 60000); // Clean up every minute
//   }
// }

// /**
//  * Duplicate connection prevention
//  * Tracks user connections and prevents multiple simultaneous connections
//  */
// export class DuplicateConnectionPreventer {
//   private userConnections = new Map<number, Set<string>>();

//   /**
//    * Middleware to prevent duplicate user connections
//    */
//   middleware(maxConnectionsPerUser: number = 3) {
//     return (socket: Socket, next: (err?: Error) => void) => {
//       try {
//         const userId = socket.handshake.auth['userInfo']?.id;

//         if (!userId) {
//           return next(); // Allow if no user ID (will be handled by auth middleware)
//         }

//         const userSockets = this.userConnections.get(userId) || new Set();

//         if (userSockets.size >= maxConnectionsPerUser) {
//           logger.warn('Duplicate connection prevented', {
//             userId,
//             existingConnections: userSockets.size,
//             maxConnections: maxConnectionsPerUser,
//             socketId: socket.id,
//           });
//           return next(new Error('Maximum connections per user exceeded'));
//         }

//         // Add this socket to user's connections
//         userSockets.add(socket.id);
//         this.userConnections.set(userId, userSockets);

//         // Clean up on disconnect
//         socket.on('disconnect', () => {
//           this.removeUserConnection(userId, socket.id);
//         });

//         next();
//       } catch (error: any) {
//         logger.error('Duplicate connection preventer error:', {
//           error: error.message,
//           socketId: socket.id,
//         });
//         next(); // Allow connection if check fails
//       }
//     };
//   }

//   /**
//    * Remove user connection on disconnect
//    */
//   private removeUserConnection(userId: number, socketId: string) {
//     const userSockets = this.userConnections.get(userId);
//     if (userSockets) {
//       userSockets.delete(socketId);
//       if (userSockets.size === 0) {
//         this.userConnections.delete(userId);
//       }
//     }
//   }

//   /**
//    * Get connection count for user
//    */
//   getUserConnectionCount(userId: number): number {
//     return this.userConnections.get(userId)?.size || 0;
//   }

//   /**
//    * Force disconnect all connections for a user
//    */
//   disconnectUser(userId: number, io: any) {
//     const userSockets = this.userConnections.get(userId);
//     if (userSockets) {
//       for (const socketId of userSockets) {
//         const socket = io.sockets.sockets.get(socketId);
//         if (socket) {
//           socket.disconnect(true);
//         }
//       }
//       this.userConnections.delete(userId);
//     }
//   }
// }

// // Initialize cleanup for memory store
// SocketRateLimiter.startCleanupInterval();
