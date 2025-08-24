import supertest from 'supertest';
import app from '@src/index';
import prisma from '@src/helpers/databaseHelpers/client';
import { generateHashedString } from '@src/utils/encrypt';

const request = supertest(app);

describe('Update Password Integration Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    // Create a test user
    const hashedPassword = await generateHashedString('oldpassword123');
    testUser = await prisma.users.create({
      data: {
        FirstName: 'Test',
        LastName: 'User',
        Email: 'updatepassword@test.com',
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

  describe('PUT /updatePassword', () => {
    it('should successfully update password with valid data', async () => {
      const response = await request
        .put('/updatePassword')
        .send({
          email: testUser.Email,
          newPassword: 'newpassword123',
          otp: '123456',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          success: true,
          message: 'Password updated successfully',
        },
      });

      // Verify password was actually updated in database
      const updatedUser = await prisma.users.findUnique({
        where: { id: testUser.id },
        select: { Password: true },
      });

      expect(updatedUser?.Password).not.toBe(testUser.Password);
    });

    it('should return 422 for non-existent email', async () => {
      const response = await request
        .put('/updatePassword')
        .send({
          email: 'nonexistent@test.com',
          newPassword: 'newpassword123',
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
        .put('/updatePassword')
        .send({
          email: 'invalid-email',
          newPassword: 'newpassword123',
          otp: '123456',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request
        .put('/updatePassword')
        .send({
          email: testUser.Email,
          // Missing newPassword and otp
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it('should return 400 for weak password', async () => {
      const response = await request
        .put('/updatePassword')
        .send({
          email: testUser.Email,
          newPassword: '123', // Too short
          otp: '123456',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it('should return 422 for invalid OTP', async () => {
      const response = await request
        .put('/updatePassword')
        .send({
          email: testUser.Email,
          newPassword: 'newpassword123',
          otp: '12', // Too short
        })
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid OTP'),
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
          Email: 'inactive@test.com',
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
        .put('/updatePassword')
        .send({
          email: inactiveUser.Email,
          newPassword: 'newpassword123',
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
