import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  AllowedClients,
  AttachmentTypes,
  Constants,
  OrderHistory,
  PaymentMethods,
  UserTypes,
} from '@src/interfaces/enums';
import { generateHashedString } from '@src/utils/encrypt';

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
  console.log('Seeding colorGradiants finish');
  //#region Modules
  await prisma.modules.upsert({
    create: {
      ModuleName: 'Car washing',
      ModuleIconLink: '/icons/car-wash.png',
      ModuleDescription: 'Wash your car easily by dispatching our providers',
      // services: {
      //   createMany: {
      //     data: [
      //       {
      //         ServiceName: 'Full washing',
      //         isAvailableForAutoSelect: true,
      //         ServiceDescription: 'Full car washing with interior and exterior cleaning',
      //         ServiceIconLink: '/icons/car-wash.png',
      //       },
      //       {
      //         ServiceName: 'Interior wash only',
      //         isAvailableForAutoSelect: true,
      //         ServiceDescription: 'Full interior cleaning washing',
      //         ServiceIconLink: '/icons/car-wash.png',
      //       },
      //       {
      //         ServiceName: 'Exterior wash only',
      //         isAvailableForAutoSelect: true,
      //         ServiceDescription: 'Full Exterior cleaning washing',
      //         ServiceIconLink: '/icons/car-wash.png',
      //       },
      //     ],
      //   },
      // },
    },
    update: {
      // services: {
      //   createMany: {
      //     data: [
      //       {
      //         ServiceName: 'Full washing',
      //         isAvailableForAutoSelect: true,
      //         ServiceDescription: 'Full car washing with interior and exterior cleaning',
      //         ServiceIconLink: '/icons/car-wash.png',
      //       },
      //       {
      //         ServiceName: 'Interior wash only',
      //         isAvailableForAutoSelect: true,
      //         ServiceDescription: 'Full interior cleaning washing',
      //         ServiceIconLink: '/icons/car-wash.png',
      //       },
      //       {
      //         ServiceName: 'Exterior wash only',
      //         isAvailableForAutoSelect: true,
      //         ServiceDescription: 'Full Exterior cleaning washing',
      //         ServiceIconLink: '/icons/car-wash.png',
      //       },
      //     ],
      //   },
      // },
    },
    where: { ModuleName: 'Car washing' },
  });
  //#endregion
  console.log('Seeding modules finish');
  //#region userTypes
  await prisma.userTypes.upsert({
    create: { TypeName: UserTypes.Customer, AllowedClients: [AllowedClients.MobileApp, AllowedClients.Web] },
    where: { TypeName: 'Customer' },
    update: { AllowedClients: [AllowedClients.MobileApp, AllowedClients.Web] },
  });
  await prisma.userTypes.upsert({
    create: { TypeName: UserTypes.Provider, AllowedClients: [AllowedClients.MobileApp, AllowedClients.Web] },
    where: { TypeName: UserTypes.Provider },
    update: { AllowedClients: [AllowedClients.MobileApp, AllowedClients.Web] },
  });
  await prisma.userTypes.upsert({
    create: { TypeName: UserTypes.Admin, AllowedClients: [AllowedClients.Web] },
    where: { TypeName: UserTypes.Admin },
    update: { AllowedClients: [AllowedClients.Web] },
  });
  //#endregion
  console.log('Seeding userTypes finish');
  //#region Users
  // Create system user for system messages
  await prisma.users.upsert({
    create: {
      Email: 'system@carwash.com',
      Password: await generateHashedString('system-user-no-login'),
      FirstName: 'System',
      LastName: 'Bot',
      Nationality: 'System',
      PhoneNumber: '000000000000',
      userTypes: { connect: { TypeName: 'Customer' } }, // Use Customer type for simplicity
    },
    update: {},
    where: { Email: 'system@carwash.com' },
  });

  await prisma.users.upsert({
    create: {
      Email: 'a',
      Password: await generateHashedString('a'),
      FirstName: 'Ahmed',
      LastName: 'Customer',
      Nationality: 'Egypt',
      PhoneNumber: '971502229604',
      userTypes: { connect: { TypeName: 'Customer' } },
      customer: { create: {} },
    },
    update: {
      userTypes: {
        update: {
          AllowedClients: { push: [AllowedClients.Web] },
        },
      },
    },
    where: { Email: 'a' },
  });

  await prisma.users.upsert({
    create: {
      Email: 'b',
      FirstName: 'Mohammed',
      LastName: 'Provider',
      Nationality: 'Egypt',
      Password: await generateHashedString('b'),
      PhoneNumber: '971501234567',
      provider: {
        create: {
          CompanyName: 'Provider Company',
          providerServices: {
            create: {
              services: { connect: { ServiceName: 'Full washing' } },
              // Price: 40,
              Pofeciency: 'Skilled',
              Rating: 4,
            },
          },
        },
      },
      userTypes: { connect: { TypeName: 'Provider' } },
    },
    update: {
      userTypes: {
        update: {
          AllowedClients: { push: [AllowedClients.MobileApp] },
        },
      },
    },
    where: { Email: 'b' },
  });
  await prisma.users.upsert({
    create: {
      Email: 'd',
      FirstName: 'Fashee5',
      LastName: 'Provider',
      Nationality: 'Egypt',
      Password: await generateHashedString('d'),
      PhoneNumber: '9715012345673',
      provider: {
        create: {
          CompanyName: 'Provider Company',
          providerServices: {
            create: {
              services: { connect: { ServiceName: 'Full washing' } },
              // Price: 40,
              Pofeciency: 'Skilled',
              Rating: 4,
            },
          },
        },
      },
      userTypes: { connect: { TypeName: 'Provider' } },
    },
    update: {
      userTypes: {
        update: {
          AllowedClients: { push: [AllowedClients.MobileApp] },
        },
      },
    },
    where: { Email: 'd' },
  });
  await prisma.users.upsert({
    create: {
      Email: 'c',
      FirstName: 'Omar',
      LastName: 'Provider',
      Nationality: 'Egypt',
      Password: await generateHashedString('C'),
      PhoneNumber: '9715012345671',
      provider: {
        create: {
          CompanyName: 'Provider Company',
          providerServices: {
            create: {
              services: { connect: { ServiceName: 'Full washing' } },
              // Price: 40,
              Pofeciency: 'Skilled',
              Rating: 4,
            },
          },
        },
      },
      userTypes: { connect: { TypeName: 'Provider' } },
    },
    update: {
      userTypes: {
        update: {
          AllowedClients: { push: [AllowedClients.MobileApp] },
        },
      },
    },
    where: { Email: 'c' },
  });
  //#endregion
  console.log('Seeding users finish');
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
  console.log('Seeding bodyTypes finish');
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
  console.log('Seeding paymentMethods finish');
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
  await prisma.orderHistoryItems.upsert({
    create: {
      HistoryName: OrderHistory.LookingForProvider,
    },
    update: {},
    where: { HistoryName: OrderHistory.LookingForProvider },
  });

  //#endregion
  console.log('Seeding orderHistoryItems finish');
  //#region AttachmentsTypes
  await prisma.attachmentTypes.upsert({
    create: {
      TypeName: AttachmentTypes.ProviderVerification,
    },
    where: {
      TypeName: AttachmentTypes.ProviderVerification,
    },
    update: {
      TypeName: AttachmentTypes.ProviderVerification,
    },
  });
  await prisma.attachmentTypes.upsert({
    create: {
      TypeName: AttachmentTypes.OrderFinished,
    },
    where: {
      TypeName: AttachmentTypes.OrderFinished,
    },
    update: {
      TypeName: AttachmentTypes.OrderFinished,
    },
  });
  //#endregion
  console.log('Seeding attachmentTypes finish');
  //#region Attachments
  await prisma.attachments.upsert({
    create: {
      canUploadFromCamera: true,
      canUploadFromGallery: true,
      isRequired: true,
      Name: 'Emirates id',
      Description: 'Upload provider emirates id. Who is going to provide the service.',
      attachmentType: {
        connect: {
          TypeName: AttachmentTypes.ProviderVerification,
        },
      },
    },
    update: {},
    where: {
      Name: 'Emirates id',
    },
  });
  await prisma.attachments.upsert({
    create: {
      Name: 'Profile image',
      isRequired: true,
      canUploadFromCamera: true,
      canUploadFromGallery: false,
      Description: 'Upload a clear and recent profile image of yourself. Take a selfie.',
      attachmentType: {
        connect: {
          TypeName: AttachmentTypes.ProviderVerification,
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
      isRequired: false,
      Name: 'Car registration card',
      canUploadFromCamera: true,
      canUploadFromGallery: true,
      Description: 'Upload car registration card (Required if you are using a car Toyota/Nissan ...etc).',
      attachmentType: {
        connect: {
          TypeName: AttachmentTypes.ProviderVerification,
        },
      },
    },
    update: {},
    where: {
      Name: 'Car registration card',
    },
  });
  await prisma.attachments.upsert({
    create: {
      canUploadFromCamera: true,
      canUploadFromGallery: false,
      isRequired: true,
      Name: 'Car from front',
      Description:
        'Take a picture for your front car/cart with clear view and company name visible. Must be taken from camera',
      attachmentType: {
        connect: {
          TypeName: AttachmentTypes.ProviderVerification,
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
      canUploadFromCamera: true,
      canUploadFromGallery: false,
      isRequired: true,
      Name: 'Car from side',
      Description:
        'Take a picture for your side car/cart with clear view and company name visible. Must be taken from camera',
      attachmentType: {
        connect: {
          TypeName: AttachmentTypes.ProviderVerification,
        },
      },
    },
    update: {},
    where: {
      Name: 'Car from side',
    },
  });
  await prisma.attachments.upsert({
    create: {
      canUploadFromCamera: true,
      canUploadFromGallery: false,
      isRequired: true,
      Name: 'Customer car from front',
      Description: 'Take a picture for the car from front',
      attachmentType: {
        connect: {
          TypeName: AttachmentTypes.OrderFinished,
        },
      },
    },
    update: {},
    where: {
      Name: 'Customer car from front',
    },
  });
  await prisma.attachments.upsert({
    create: {
      isRequired: true,
      canUploadFromCamera: true,
      canUploadFromGallery: false,
      Name: 'Customer car from back',
      Description: 'Take a picture for the car from back',
      attachmentType: {
        connect: {
          TypeName: AttachmentTypes.OrderFinished,
        },
      },
    },
    update: {},
    where: {
      Name: 'Customer car from back',
    },
  });
  //#endregion
  console.log('Seeding attachments finish');
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
  console.log('Seeding constants finish');
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
