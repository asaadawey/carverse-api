import supertest from 'supertest';
import app from '@src/index';
import prisma from '@src/helpers/databaseHelpers/client';
import { generateHashedString } from '@src/utils/encrypt';

const request = supertest(app);

describe('Get All Orders Integration Tests', () => {
  let testCustomer: any;
  let testProvider: any;
  let testOrder: any;
  let testCar: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test users
    const hashedPassword = await generateHashedString('password123');

    const customerUser = await prisma.users.create({
      data: {
        FirstName: 'Customer',
        LastName: 'User',
        Email: 'customer@test.com',
        Password: hashedPassword,
        PhoneNumber: '+1234567890',
        Nationality: 'US',
        UserTypeID: 1, // Customer
        isActive: true,
      },
    });

    const providerUser = await prisma.users.create({
      data: {
        FirstName: 'Provider',
        LastName: 'User',
        Email: 'provider@test.com',
        Password: hashedPassword,
        PhoneNumber: '+1987654321',
        Nationality: 'US',
        UserTypeID: 2, // Provider
        isActive: true,
      },
    });

    // Create customer and provider records
    testCustomer = await prisma.customer.create({
      data: {
        UserID: customerUser.id,
      },
    });

    testProvider = await prisma.provider.create({
      data: {
        UserID: providerUser.id,
        NumberOfOrders: 0,
      },
    });

    // Create a test car
    const bodyType = await prisma.bodyTypes.findFirst();
    testCar = await prisma.cars.create({
      data: {
        UserID: customerUser.id,
        PlateNumber: 'TEST123',
        Manufacturer: 'Toyota',
        Model: 'Camry',
        Color: 'Blue',
        PlateCity: 'TestCity',
        BodyTypeID: bodyType?.id || 1,
      },
    });

    // Create a payment method
    const paymentMethod = await prisma.paymentMethods.findFirst();

    // Create a test order
    testOrder = await prisma.orders.create({
      data: {
        CustomerID: testCustomer.id,
        ProviderID: testProvider.id,
        PaymentMethodID: paymentMethod?.id || 1,
        OrderTotalAmount: 25.99,
        Longitude: -122.4194,
        Latitude: 37.7749,
        AddressString: '123 Test Street',
        AdditionalNotes: 'Test order',
      },
    });

    // Get auth token by logging in
    const loginResponse = await request.post('/login').send({
      email: customerUser.Email,
      password: 'password123',
    });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testOrder) {
      await prisma.orders.delete({
        where: { id: testOrder.id },
      });
    }
    if (testCar) {
      await prisma.cars.delete({
        where: { id: testCar.id },
      });
    }
    if (testCustomer) {
      await prisma.customer.delete({
        where: { id: testCustomer.id },
      });
    }
    if (testProvider) {
      await prisma.provider.delete({
        where: { id: testProvider.id },
      });
    }
    // Delete users last due to foreign key constraints
    await prisma.users.deleteMany({
      where: {
        Email: {
          in: ['customer@test.com', 'provider@test.com'],
        },
      },
    });
  });

  describe('GET /orders', () => {
    it('should successfully get all orders with authentication', async () => {
      const response = await request.get('/orders').set('Authorization', `Bearer ${authToken}`).expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            Longitude: expect.any(Number),
            Latitude: expect.any(Number),
            AddressString: expect.any(String),
            OrderTotalAmount: expect.any(Number),
            OrderCreatedDate: expect.any(String),
          }),
        ]),
      });
    });

    it('should support pagination parameters', async () => {
      const response = await request
        .get('/orders?take=5&skip=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });
    });

    it('should filter by customer ID', async () => {
      const response = await request
        .get(`/orders?customerId=${testCustomer.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      // All orders should belong to the specified customer
      response.body.data.forEach((order: any) => {
        expect(order.customer.id).toBe(testCustomer.id);
      });
    });

    it('should filter by provider ID', async () => {
      const response = await request
        .get(`/orders?providerId=${testProvider.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      // All orders should belong to the specified provider
      response.body.data.forEach((order: any) => {
        expect(order.provider.id).toBe(testProvider.id);
      });
    });

    it('should filter by status', async () => {
      const response = await request
        .get('/orders?status=Pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });
    });

    it('should combine multiple filters', async () => {
      const response = await request
        .get(`/orders?customerId=${testCustomer.id}&providerId=${testProvider.id}&take=10&skip=0`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request.get('/orders').expect(401);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it('should handle invalid query parameters gracefully', async () => {
      const response = await request
        .get('/orders?customerId=invalid&take=not_a_number')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Should still work, just ignore invalid params

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });
    });
  });
});
