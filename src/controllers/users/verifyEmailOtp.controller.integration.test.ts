import supertest from 'supertest';
import app from '@src/index';
import prisma from '@src/helpers/databaseHelpers/client';
import { generateHashedString } from '@src/utils/encrypt';

const request = supertest(app);

describe('Verify Email OTP Integration Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    // Create a test user
    const hashedPassword = await generateHashedString('password123');
    testUser = await prisma.users.create({
      data: {
        FirstName: 'Test',
        LastName: 'User',
        Email: 'verifyotp@test.com',
        Password: hashedPassword,
        PhoneNumber: '+1234567890',
        Nationality: 'US',
        UserTypeID: 1,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await prisma.users.delete({
        where: { id: testUser.id },
      });
    }
  });

  describe('POST /verifyEmailOtp', () => {
    it('should successfully verify OTP with valid data', async () => {
      const response = await request
        .post('/verifyEmailOtp')
        .send({
          email: testUser.Email,
          otp: '123456',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          success: true,
          message: 'OTP verified successfully',
          verified: true,
        },
      });
    });

    it('should return 422 for non-existent email', async () => {
      const response = await request
        .post('/verifyEmailOtp')
        .send({
          email: 'nonexistent@test.com',
          otp: '123456',
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('User not found'),
      });
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request
        .post('/verifyEmailOtp')
        .send({
          email: 'invalid-email',
          otp: '123456',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request
        .post('/verifyEmailOtp')
        .send({
          email: testUser.Email,
          // Missing otp
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it('should return 422 for invalid OTP format - too short', async () => {
      const response = await request
        .post('/verifyEmailOtp')
        .send({
          email: testUser.Email,
          otp: '123', // Too short
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid OTP format'),
      });
    });

    it('should return 422 for invalid OTP format - too long', async () => {
      const response = await request
        .post('/verifyEmailOtp')
        .send({
          email: testUser.Email,
          otp: '1234567', // Too long
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid OTP format'),
      });
    });

    it('should return 422 for invalid OTP format - non-numeric', async () => {
      const response = await request
        .post('/verifyEmailOtp')
        .send({
          email: testUser.Email,
          otp: 'abc123', // Contains letters
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid OTP format'),
      });
    });

    it('should return 422 for empty OTP', async () => {
      const response = await request
        .post('/verifyEmailOtp')
        .send({
          email: testUser.Email,
          otp: '', // Empty
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid OTP format'),
      });
    });
  });

  describe('Inactive user scenarios', () => {
    let inactiveUser: any;

    beforeAll(async () => {
      // Create an inactive test user
      const hashedPassword = await generateHashedString('password123');
      inactiveUser = await prisma.users.create({
        data: {
          FirstName: 'Inactive',
          LastName: 'User',
          Email: 'inactiveverify@test.com',
          Password: hashedPassword,
          PhoneNumber: '+1987654321',
          Nationality: 'US',
          UserTypeID: 1,
          isActive: false,
        },
      });
    });

    afterAll(async () => {
      if (inactiveUser) {
        await prisma.users.delete({
          where: { id: inactiveUser.id },
        });
      }
    });

    it('should return 422 for inactive user', async () => {
      const response = await request
        .post('/verifyEmailOtp')
        .send({
          email: inactiveUser.Email,
          otp: '123456',
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('inactive'),
      });
    });
  });
});
