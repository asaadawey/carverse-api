import { PrismaClient } from '.prisma/client';
import { AllowedClients, OrderHistory, PaymentMethods } from 'src/interfaces/enums';

const prisma = new PrismaClient();

const main = async () => {
  console.log('Seeding prisma at ' + process.env.DATABASE_URL);
  //#region ColorGradiants
  await prisma.colorGradiants.upsert({
    create: {
      ColorName: 'Gold',
      ColorMainText: 'white',
      ColorSecondaryText: 'white',
      ColorEnd: '#ffac33',
      ColorStart: '#b26a00',
    },
    update: {},
    where: { ColorName: 'Gold' },
  });
  await prisma.colorGradiants.upsert({
    create: {
      ColorName: 'Orange',
      ColorMainText: 'black',
      ColorSecondaryText: 'black',
      ColorEnd: '#b23c17',
      ColorStart: '#ff784e',
    },
    update: {},
    where: { ColorName: 'Orange' },
  });
  await prisma.colorGradiants.upsert({
    create: {
      ColorName: 'Green',
      ColorMainText: 'black',
      ColorSecondaryText: 'black',
      ColorEnd: '#618833',
      ColorStart: '#a2cf6e',
    },
    update: {},
    where: { ColorName: 'Green' },
  });
  await prisma.colorGradiants.upsert({
    create: {
      ColorName: 'Blue',
      ColorMainText: 'white',
      ColorSecondaryText: 'white',
      ColorEnd: '#1769aa',
      ColorStart: '#2196f3',
    },
    update: {},
    where: { ColorName: 'Blue' },
  });
  await prisma.colorGradiants.upsert({
    create: {
      ColorName: 'Purple',
      ColorMainText: 'white',
      ColorSecondaryText: 'white',
      ColorEnd: '#482880',
      ColorStart: '#8561c5',
    },
    update: {},
    where: { ColorName: 'Purple' },
  });
  //#endregion
  //#region Modules
  await prisma.modules.upsert({
    create: {
      ModuleName: 'Car washing',
      ModuleIconLink: '/icons/car-wash.png',
      ModuleDescription: 'Wash your car easily by dispatching our providers',
      services: {
        createMany: {
          data: [
            {
              ServiceName: 'Stem wash',
              ServiceDescription: 'Exterior stem wash with rapid interior washing',
              GradientID:
                (
                  await prisma.colorGradiants.findUnique({
                    where: { ColorName: 'Gold' },
                  })
                )?.id ?? 0,
              ServiceIconLink: '/icons/car-wash.png',
            },
            {
              ServiceName: 'Interior intensive wash',
              ServiceDescription: 'Full interior cleaning washing',
              GradientID:
                (
                  await prisma.colorGradiants.findUnique({
                    where: { ColorName: 'Orange' },
                  })
                )?.id ?? 0,
              ServiceIconLink: '/icons/car-wash.png',
            },
            {
              ServiceName: 'Exterior wash',
              ServiceDescription: 'Full Exterior cleaning washing',
              GradientID:
                (
                  await prisma.colorGradiants.findUnique({
                    where: { ColorName: 'Green' },
                  })
                )?.id ?? 0,
              ServiceIconLink: '/icons/car-wash.png',
            },
          ],
        },
      },
    },
    update: {},
    where: { ModuleName: 'Car washing' },
  });
  //#endregion
  //#region Customers
  await prisma.userTypes.upsert({
    create: { TypeName: 'Customer', AllowedClients: [AllowedClients.MobileApp] },
    where: { TypeName: 'Customer' },
    update: { AllowedClients: [AllowedClients.MobileApp] },
  });
  await prisma.userTypes.upsert({
    create: { TypeName: 'Provider', AllowedClients: [AllowedClients.MobileApp] },
    where: { TypeName: 'Provider' },
    update: { AllowedClients: [AllowedClients.MobileApp] },
  });
  await prisma.userTypes.upsert({
    create: { TypeName: 'Admin', AllowedClients: [AllowedClients.CP] },
    where: { TypeName: 'Admin' },
    update: { AllowedClients: [AllowedClients.MobileApp] },
  });
  //#endregion
  //#region Users
  await prisma.users.upsert({
    create: {
      Email: 'a',
      Password: 'a',
      FirstName: 'Ahmed',
      LastName: 'Customer',
      Nationality: 'Egypt',
      PhoneNumber: '971502229604',
      userTypes: { connect: { TypeName: 'Customer' } },
      customer: { create: {} },
    },
    update: {},
    where: { Email: 'a' },
  });

  await prisma.users.upsert({
    create: {
      Email: 'b',
      FirstName: 'Mohammed',
      LastName: 'Provider',
      Nationality: 'Egypt',
      Password: 'b',
      PhoneNumber: '971501234567',
      provider: {
        create: {
          providerServices: {
            create: {
              services: { connect: { ServiceName: 'Stem wash' } },
              Price: 40,
              Pofeciency: 'Skilled',
              Rating: 4,
            },
          },
        },
      },
      userTypes: { connect: { TypeName: 'Provider' } },
    },
    update: {},
    where: { Email: 'b' },
  });
  //#endregion
  //#region BodyTypes
  await prisma.bodyTypes.upsert({
    create: { TypeName: 'Sedan' },
    where: { TypeName: 'Sedan' },
    update: {},
  });
  //#endregion
  //#region PaymentMethods
  await prisma.paymentMethods.upsert({
    create: { MethodName: PaymentMethods.Cash, MethodDescription: '' },
    update: {},
    where: { MethodName: PaymentMethods.Cash },
  });
  //#endregion
  //#region OrderHistoryItems
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.Pending,
    },
    update: {},
    where: { HistoryName: OrderHistory.Pending },
  });
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.Rejected,
    },
    update: {},
    where: { HistoryName: OrderHistory.Rejected },
  });
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.Accepted,
    },
    update: {},
    where: { HistoryName: OrderHistory.Accepted },
  });
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.ProviderArrived,
    },
    update: {},
    where: { HistoryName: OrderHistory.ProviderArrived },
  });
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.ServiceFinished,
    },
    update: {},
    where: { HistoryName: OrderHistory.ServiceFinished },
  });
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.Cancelled,
    },
    update: {},
    where: { HistoryName: OrderHistory.Cancelled },
  });
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.Timeout,
    },
    update: {},
    where: { HistoryName: OrderHistory.Timeout },
  });
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.CustomerCancelled,
    },
    update: {},
    where: { HistoryName: OrderHistory.CustomerCancelled },
  });

  //#endregion

  //#region AttachmentsTypes
  await prisma.attachmentTypes.upsert({
    create: {
      TypeName: 'Provider',
    },
    where: {
      TypeName: 'Provider',
    },
    update: {},
  });
  //#endregion

  //#region Attachments
  await prisma.attachments.upsert({
    create: {
      Name: 'Emirates id',
      Description: 'Used for verification purposes',
      attachmentType: {
        connect: {
          TypeName: 'Provider',
        },
      },
    },
    update: {},
    where: {
      id: 1,
    },
  });
  await prisma.attachments.upsert({
    create: {
      Name: 'Profile image',
      Description: 'Used for verification purposes',
      attachmentType: {
        connect: {
          TypeName: 'Provider',
        },
      },
    },
    update: {},
    where: {
      id: 2,
    },
  });
  await prisma.attachments.upsert({
    create: {
      Name: 'Car registration',
      Description: 'Used for verification purposes',
      attachmentType: {
        connect: {
          TypeName: 'Provider',
        },
      },
    },
    update: {},
    where: {
      id: 3,
    },
  });
  //#endregion
};

if (process.argv[2] === '--exit') {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.log(error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}

export default main;
