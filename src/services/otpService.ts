/**
 * OTP Service
 *
 * This service handles OTP (One-Time Password) operations:
 * - Generation and storage of OTPs
 * - Validation and verification
 * - Cleanup of expired OTPs
 * - Rate limiting
 */

import { PrismaClient } from '@prisma/client';
import { otpConfig } from '@src/config/email';
import logger from '@src/utils/logger';
import crypto from 'crypto';
import prismaClient from '@src/helpers/databaseHelpers/client';

export type OtpType = 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | 'TWO_FACTOR_AUTH';

export interface OtpGenerationResult {
  success: boolean;
  otp?: string;
  expiresAt?: Date;
  error?: string;
}

export interface OtpVerificationResult {
  success: boolean;
  isUsed?: boolean;
  error?: string;
  attemptsRemaining?: number;
}

/**
 * Generate a new OTP for the given email and type
 */
export async function generateOtp(
  email: string,
  type: OtpType = 'PASSWORD_RESET',
  prisma: PrismaClient = prismaClient,
): Promise<OtpGenerationResult> {
  try {
    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(email, type, prisma);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: `Too many OTP requests. Please try again in ${rateLimitCheck.waitMinutes} minutes.`,
      };
    }

    // Invalidate any existing OTPs for this email and type
    await invalidateExistingOtps(email, type, prisma);

    // Generate new OTP
    const otp = generateOtpCode();
    const expiresAt = new Date(Date.now() + otpConfig.expirationMinutes * 60 * 1000);

    // Store in database
    await prisma.emailOtps.create({
      data: {
        email,
        otp,
        type,
        expiresAt,
        isUsed: false,
      },
    });

    logger.info('OTP generated successfully', {
      email,
      type,
      expiresAt,
      otpLength: otp.length,
    });

    return {
      success: true,
      otp,
      expiresAt,
    };
  } catch (error) {
    logger.error('Failed to generate OTP', {
      email,
      type,
      error: error instanceof Error ? error.message : error,
    });

    return {
      success: false,
      error: 'Failed to generate OTP. Please try again.',
    };
  }
}

/**
 * Verify an OTP
 */
export async function verifyOtp(
  email: string,
  otp: string,
  type: OtpType = 'PASSWORD_RESET',
  prisma: PrismaClient = prismaClient,
  deleteOtp: boolean = true,
): Promise<OtpVerificationResult> {
  try {
    // Find the OTP record
    const otpRecord = await prisma.emailOtps.findFirst({
      where: {
        AND: [{ email }, { otp }, { type }],
      },
      select: {
        id: true,
        otp: true,
        expiresAt: true,
        isUsed: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      logger.warn('OTP verification failed: OTP not found or already used', {
        email,
        type,
        providedOtp: otp.length > 0 ? `${otp.substring(0, 2)}****` : 'empty',
      });

      return {
        success: false,
        error: 'Invalid or expired OTP.',
      };
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      logger.warn('OTP verification failed: OTP expired', {
        email,
        type,
        expiresAt: otpRecord.expiresAt,
      });

      // Mark as used to prevent further attempts
      if (deleteOtp) {
        await prisma.emailOtps.delete({
          where: { id: otpRecord.id },
        });
      } else {
        await prisma.emailOtps.update({
          where: { id: otpRecord.id },
          data: { isUsed: true },
        });
      }

      return {
        success: false,
        error: 'OTP has expired. Please request a new one.',
      };
    }

    // Mark as used to prevent further attempts
    if (deleteOtp) {
      await prisma.emailOtps.delete({
        where: { id: otpRecord.id },
      });
    } else {
      await prisma.emailOtps.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
    }

    logger.info('OTP verified successfully', {
      email,
      type,
      otpId: otpRecord.id,
    });

    return {
      isUsed: otpRecord.isUsed,
      success: true,
    };
  } catch (error) {
    logger.error('Failed to verify OTP', {
      email,
      type,
      error: error instanceof Error ? error.message : error,
    });

    return {
      success: false,
      error: 'Failed to verify OTP. Please try again.',
    };
  }
}

/**
 * Check rate limiting for OTP generation
 */
async function checkRateLimit(
  email: string,
  type: OtpType,
  prisma: PrismaClient,
): Promise<{ allowed: boolean; waitMinutes?: number }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentOtps = await prisma.emailOtps.count({
    where: {
      email,
      type,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  if (recentOtps >= otpConfig.maxOtpsPerHour) {
    // Find the oldest OTP in the last hour to calculate wait time
    const oldestRecentOtp = await prisma.emailOtps.findFirst({
      where: {
        email,
        type,
        createdAt: {
          gte: oneHourAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const waitMinutes = oldestRecentOtp
      ? Math.ceil(60 - (Date.now() - oldestRecentOtp.createdAt.getTime()) / 1000 / 60)
      : 60;

    return {
      allowed: false,
      waitMinutes: Math.max(waitMinutes, 1),
    };
  }

  return { allowed: true };
}

/**
 * Invalidate existing OTPs for email and type
 */
async function invalidateExistingOtps(email: string, type: OtpType, prisma: PrismaClient): Promise<void> {
  await prisma.emailOtps.updateMany({
    where: {
      email,
      type,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });
}

/**
 * Generate a random OTP code
 */
function generateOtpCode(): string {
  // Generate cryptographically secure random number
  const min = Math.pow(10, otpConfig.length - 1);
  const max = Math.pow(10, otpConfig.length) - 1;

  // Use crypto.randomInt for better security
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Clean up expired OTPs (should be called periodically)
 */
export async function cleanupExpiredOtps(prisma: PrismaClient = prismaClient): Promise<number> {
  try {
    const result = await prisma.emailOtps.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          {
            isUsed: true,
            createdAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
            },
          },
        ],
      },
    });

    if (result.count > 0) {
      logger.info('Cleaned up expired OTPs', { count: result.count });
    }

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup expired OTPs', { error });
    return 0;
  }
}

/**
 * Get OTP statistics for monitoring
 */
export async function getOtpStats(prisma: PrismaClient = prismaClient): Promise<{
  total: number;
  active: number;
  expired: number;
  used: number;
}> {
  const [total, active, expired, used] = await Promise.all([
    prisma.emailOtps.count(),
    prisma.emailOtps.count({
      where: {
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    }),
    prisma.emailOtps.count({
      where: {
        isUsed: false,
        expiresAt: { lt: new Date() },
      },
    }),
    prisma.emailOtps.count({
      where: { isUsed: true },
    }),
  ]);

  return { total, active, expired, used };
}

// Export for backward compatibility
export default {
  generateOtp,
  verifyOtp,
  cleanupExpiredOtps,
  getOtpStats,
};
