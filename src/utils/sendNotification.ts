import { sendSystemMessage } from '@src/web-socket/chatSocket';
import serviceAccount from 'firebase-admin';
import envVars from '@src/config/environment';
import { env } from 'process';

type SendNotificationArgs = {
  data: Record<string, any> | null | undefined;
  title: string;
  description: string;
  expoToken: string;
};

type SendNotificationResult = {
  result: boolean;
  message: string;
};

// Only initialize Firebase in non-test environments
if (
  process.env.NODE_ENV !== 'test' &&
  envVars.firebase.projectId &&
  envVars.firebase.clientEmail &&
  envVars.firebase.privateKey
) {
  try {
    serviceAccount.initializeApp({
      credential: serviceAccount.credential.cert({
        projectId: envVars.firebase.projectId,
        clientEmail: envVars.firebase.clientEmail,
        privateKey: envVars.firebase.privateKey?.replace?.(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

export default async ({
  data,
  description,
  expoToken,
  title,
}: SendNotificationArgs): Promise<SendNotificationResult> => {
  console.log('TRYING TO SEND NOTIFICATION ', { data, title, description, expoToken });
  if (!expoToken) return { message: 'No token', result: false };
  try {
    console.log('Sending notification..., Token:', expoToken);

    // Convert all data values to strings as required by Firebase
    const stringifiedData: Record<string, string> = {};
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          // Convert objects and arrays to JSON strings
          if (typeof value === 'object') {
            stringifiedData[key] = JSON.stringify(value);
          } else {
            stringifiedData[key] = String(value);
          }
        }
      }
    }

    console.log('Converted data for Firebase:', stringifiedData);

    const response = await serviceAccount.messaging().send({
      notification: {
        title: title,
        body: description,
      },
      data: {
        ...stringifiedData,
        timestamp: new Date().toISOString(),
      },
      token: expoToken,
      android: {
        notification: {
          priority: 'high',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: title,
            },
            sound: 'default',
          },
        },
      },
    });
    console.log('Successfully sent message:', response);
    return { result: true, message: response };
  } catch (error: any) {
    console.error('Error sending message:', error);
    return { result: false, message: error.message };
  }
};
