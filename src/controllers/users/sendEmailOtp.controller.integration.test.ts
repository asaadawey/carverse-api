import supertest from 'supertest';
import app from '@src/index';
import prisma from '@src/helpers/databaseHelpers/client';
import { generateHashedString } from '@src/utils/encrypt';

const request = supertest(app);

describe('Send Email OTP Integration Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    // Create a test user
    const hashedPassword = await generateHashedString('password123');
    testUser = await prisma.users.create({
      data: {
        FirstName: 'Test',
        LastName: 'User',
        Email: 'sendotp@test.com',
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

  describe('POST /sendEmailOtp', () => {
    it('should successfully send OTP with valid email', async () => {
      const response = await request
        .post('/sendEmailOtp')
        .send({
          email: testUser.Email,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          success: true,
          message: 'OTP sent to your email address',
          otpSent: true,
        },
      });
    });

    it('should return 422 for non-existent email', async () => {
      const response = await request
        .post('/sendEmailOtp')
        .send({
          email: 'nonexistent@test.com',
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('User not found'),
      });
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request
        .post('/sendEmailOtp')
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it('should return 400 for missing email field', async () => {
      const response = await request
        .post('/sendEmailOtp')
        .send({
          // Missing email field
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
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
          Email: 'inactiveotp@test.com',
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
        .post('/sendEmailOtp')
        .send({
          email: inactiveUser.Email,
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('inactive'),
      });
    });
  });
});
