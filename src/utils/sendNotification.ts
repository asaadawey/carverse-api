import { Expo } from 'expo-server-sdk';

type SendNotificationArgs = {
  data: any;
  title: string;
  description: string;
  expoToken: string;
};

type SendNotificationResult = {
  result: boolean;
  message: string;
};

export default async (args: SendNotificationArgs): Promise<SendNotificationResult> => {
  if (!args.expoToken) return { message: 'No token', result: false };

  if (!Expo.isExpoPushToken(args.expoToken))
    return { message: 'Not a valid expo token : ' + args.expoToken, result: false };

  const expo = new Expo();

  try {
    const result = await expo.sendPushNotificationsAsync([
      { to: args.expoToken, body: args.description, title: args.title },
    ]);

    return {
      result: result[0].status === 'ok',
      message: '',
    };
  } catch (e) {
    return {
      message: e as any,
      result: false,
    };
  }
};
