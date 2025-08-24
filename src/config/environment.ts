import environmentSchema from '@src/config/schema';
import { config } from 'dotenv';

config();

const variables: Record<string, any> = { ...process.env };

const serverVariables = {
  version: 'HEROKU_RELEASE_VERSION',
  serverId: 'HEROKU_DYNO_ID',
  releaseCreatedAt: 'HEROKU_RELEASE_CREATED_AT',
  commitId: 'HEROKU_SLUG_COMMIT',
};

// Don't validate in case of CI
let values;
if (process.env.CI || process.env.NODE_ENV === 'test') {
  values = process.env;
} else {
  const { ...allValues } = environmentSchema.validateSync(variables);
  values = allValues;
}

export const isDev = values.NODE_ENV === 'development';
export const isTest = values.NODE_ENV === 'test';

export default {
  mode: values.NODE_ENV,
  appSecret: values.APP_SECRET,
  port: values.PORT,
  herokuPostgresqlGreenUrl: values.HEROKU_POSTGRESQL_GREEN_URL,
  databaseUrl: values.DATABASE_URL,
  appName: values.APP_NAME,
  auth: {
    apiKey: values.API_KEY,
    apiSalt: values.API_SALT,
    apiValue: values.API_VALUE,
    skipAuth: values.SKIP_AUTH === 'true',
    authKey: values.AUTH_KEY,
  },
  allowedClient: {
    key: values.ALLOWED_CLIENT_KEY as string,
  },
  order: {
    timeout: values.ORDER_TIMEOUT_SECONDS,
    locationThreshold: values.CUTOMER_PROVIDER_LOCATION_THERSHOLD,
  },
  logVerbose: values.LOG_VERBOSE,
  aws: {
    s3BucketName: values.AWS_S3_BUCKET_NAME,
    s3Region: values.AWS_S3_REGION,
  },
  stripe: {
    secret: values.STRIPE_API_KEY,
  },
  cookies: {
    secret: values.COOKIE_SECRET,
    key: values.COOKIE_KEY,
  },
  appServer: {
    version: variables[serverVariables.version] || values.VERSION || '1.0-dev',
    releaseDate: variables[serverVariables.releaseCreatedAt] || new Date().toISOString(),
    slugCommitId: variables[serverVariables.commitId] || 'none',
    serverId: variables[serverVariables.serverId] || 'localhost',
  },
  redis: {
    url: values.REDIS_URL || '',
    host: values.REDIS_HOST,
    username: values.REDIS_USERNAME || '',
    password: values.REDIS_PASSWORD,
    port: values.REDIS_PORT,
  },
  email: {
    service: values.EMAIL_SERVICE,
    host: values.EMAIL_HOST,
    port: values.EMAIL_PORT,
    secure: values.EMAIL_SECURE === 'true',
    user: values.EMAIL_USER,
    password: values.EMAIL_PASSWORD,
    fromName: values.EMAIL_FROM_NAME,
    fromAddress: values.EMAIL_FROM_ADDRESS,
  },
  otpEmail: {
    user: values.OTP_EMAIL_USER,
    password: values.OTP_EMAIL_PASSWORD,
  },
  supportEmail: {
    user: values.SUPPORT_EMAIL_USER,
    password: values.SUPPORT_EMAIL_PASSWORD,
  },
  firebase: {
    projectId: values.FIREBASE_PROJECT_ID,
    clientEmail: values.FIREBASE_CLIENT_EMAIL,
    privateKey: values.FIREBASE_PRIVATE_KEY,
  },
  paymob: {
    baseUrl: values.PAYMOB_BASE_URL,
    apiKey: values.PAYMOB_API_KEY,
  },
  carQuery: {
    makesUrl: values.CARQUERY_API_URL,
    modelsUrl: values.CARQUERY_MODELS_URL,
  },
  baseUrl: values.BASE_URL,
  passwordHashSeperator: values.PASSWORD_HASH_SEPERATOR,
  superCachePassword: values.SUPER_CACHE_PASSWORD,
};
