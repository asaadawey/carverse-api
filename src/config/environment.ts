import environmentSchema from 'src/config/schema';
import { config } from 'dotenv';

config();

const variables: Record<string, any> = { ...process.env };

const { ...values } = environmentSchema.validateSync(variables);

export default {
  mode: values.NODE_ENV,
  appSecret: values.APP_SECRET,
  orderTimeout: values.ORDER_TIMEOUT,
  port: values.PORT,
  herokuPostgresqlGreenUrl: values.HEROKU_POSTGRESQL_GREEN_URL,
  databaseUrl: values.DATABASE_URL,
  appName: values.APP_NAME,
  auth: {
    apiKey: values.API_KEY,
    apiSalt: values.API_SALT,
    apiValue: values.API_VALUE,
    skipAuth: values.SKIP_AUTH,
    authKey: values.AUTH_KEY,
  },
  allowedClient: {
    key: values.ALLOWED_CLIENT_KEY,
  },
  order: {
    timeout: values.ORDER_TIMEOUT_SECONDS,
    locationThreshold: values.CUTOMER_PROVIDER_LOCATION_THERSHOLD,
  },
  logVerbose: values.LOG_VERBOSE,
};
