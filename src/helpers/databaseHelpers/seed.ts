import { PrismaClient } from '.prisma/client';
import { AllowedClients, Constants, OrderHistory, PaymentMethods } from 'src/interfaces/enums';

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
  console.log("Seeding colorGradiants finish")
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
  console.log("Seeding modules finish")
  //#region userTypes
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
  console.log("Seeding userTypes finish")
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
              // Price: 40,
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
  console.log("Seeding users finish")
  //#region BodyTypes
  await prisma.bodyTypes.upsert({
    create: { TypeName: 'Sedan' },
    where: { TypeName: 'Sedan' },
    update: {},
  });
  await prisma.bodyTypes.upsert({
    create: { TypeName: 'Station' },
    where: { TypeName: 'Station' },
    update: {},
  });
  await prisma.bodyTypes.upsert({
    create: { TypeName: '4X4' },
    where: { TypeName: '4X4' },
    update: {},
  });
  //#endregion
  console.log("Seeding bodyTypes finish")
  //#region PaymentMethods
  await prisma.paymentMethods.upsert({
    create: { MethodName: PaymentMethods.Cash, MethodDescription: '' },
    update: {},
    where: { MethodName: PaymentMethods.Cash },
  });
  await prisma.paymentMethods.upsert({
    create: { MethodName: PaymentMethods.Credit, MethodDescription: '' },
    update: {},
    where: { MethodName: PaymentMethods.Credit },
  });
  //#endregion
  console.log("Seeding paymentMethods finish")
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
      HistoryName: OrderHistory.PendingPayment,
    },
    update: {},
    where: { HistoryName: OrderHistory.PendingPayment },
  });
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.PaymentCaptureCancelled,
    },
    update: {},
    where: { HistoryName: OrderHistory.PaymentCaptureCancelled },
  });
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.PaymentCaptured,
    },
    update: {},
    where: { HistoryName: OrderHistory.PaymentCaptured },
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
  console.log("Seeding orderHistoryItems finish")
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
  await prisma.attachmentTypes.upsert({
    create: {
      TypeName: 'Orders Finished',
    },
    where: {
      TypeName: 'Orders Finished',
    },
    update: {},
  });
  //#endregion
  console.log("Seeding attachmentTypes finish")
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
      Name: "Emirates id",
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
      Name: 'Profile image',
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
      Name: 'Car registration',
    },
  });
  await prisma.attachments.upsert({
    create: {
      Name: 'Car from front',
      Description: 'Used for verification purposes',
      attachmentType: {
        connect: {
          TypeName: 'Orders Finished',
        },
      },
    },
    update: {},
    where: {
      Name: 'Car from front',
    },
  });
  await prisma.attachments.upsert({
    create: {
      Name: 'Car from back',
      Description: 'Used for verification purposes',
      attachmentType: {
        connect: {
          TypeName: 'Orders Finished',
        },
      },
    },
    update: {},
    where: {
      Name: 'Car from back',
    },
  });
  //#endregion
  console.log("Seeding attachments finish")
  //#region Constants
  await prisma.constants.upsert({
    create: {
      Type: 'Percentage',
      Name: Constants.VAT,
      Label: 'VAT (5%)',
      Value: 5,
    },
    update: {},
    where: {
      Name: Constants.VAT,
    },
  });
  await prisma.constants.upsert({
    create: {
      Type: 'Amount',
      Name: Constants.ServiceCharges,
      Label: 'Service charges',
      Value: 3,
    },
    update: {},
    where: {
      Name: Constants.ServiceCharges,
    },
  });
  await prisma.constants.upsert({
    create: {
      Type: 'Percentage',
      Label: 'Online payment charges',
      Name: Constants.OnlinePaymentCharges,
      Value: 6,
    },
    update: {},
    where: {
      Name: Constants.OnlinePaymentCharges,
    },
  });
  await prisma.constants.upsert({
    create: {
      Type: 'Numeric',
      Label: '',
      Name: Constants.ProviderKMThershold,
      Value: 1,
    },
    update: {},
    where: {
      Name: Constants.ProviderKMThershold,
    },
  });
  //#endregion
  console.log("Seeding constants finish")
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
