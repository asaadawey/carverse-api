import * as yup from 'yup';

// Security validation helpers
const isStrongSecret = (value?: string): boolean => {
  return Boolean(value && value.length >= 32 && value !== 'N');
};

const isValidEmail = (email?: string): boolean => {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
};

const environmentSchema = yup
  .object()
  .shape({
    DATABASE_URL: yup.string().required(),
    // HEROKU_POSTGRESQL_GREEN_URL: yup.string().required(),
    PORT: yup.string().required(),
    APP_SECRET: yup.string().required().test('strong-secret', 'APP_SECRET must be strong (32+ chars)', isStrongSecret),
    APP_NAME: yup.string().required(),
    SKIP_AUTH: yup.string().required().oneOf(['true', 'false'], 'SKIP_AUTH must be true or false'),
    NODE_ENV: yup.string().required().oneOf(['development', 'test', 'staging', 'production'], 'Invalid NODE_ENV'),
    API_KEY: yup.string().required(),
    API_VALUE: yup.string().required(),
    AUTH_KEY: yup.string().required(),
    API_SALT: yup.string().required(),

    LOG_VERBOSE: yup.string().required(),
    ALLOWED_CLIENT_KEY: yup.string().required(),
    ORDER_TIMEOUT_SECONDS: yup.string().required(),
    CUTOMER_PROVIDER_LOCATION_THERSHOLD: yup.string().required(),
    AWS_S3_BUCKET_NAME: yup.string().required(),
    AWS_S3_REGION: yup.string().required(),
    STRIPE_API_KEY: yup.string().required(),
    COOKIE_KEY: yup.string().required(),
    COOKIE_SECRET: yup
      .string()
      .required()
      .test('strong-cookie-secret', 'COOKIE_SECRET must be strong', (value) => value !== 'N'),
    PASSWORD_HASH_SEPERATOR: yup.string().required(),

    REDIS_HOST: yup.string().optional(),
    REDIS_USERNAME: yup.string().optional(),
    REDIS_PASSWORD: yup.string().optional(),
    REDIS_PORT: yup.string().optional(),
    REDIS_URL: yup.string().optional(),

    // Email configuration with validation
    EMAIL_SERVICE: yup.string().required(),
    EMAIL_HOST: yup.string().required(),
    EMAIL_PORT: yup.string().required(),
    EMAIL_SECURE: yup.string().required().oneOf(['true', 'false'], 'EMAIL_SECURE must be true or false'),
    EMAIL_USER: yup.string().required().test('valid-email', 'EMAIL_USER must be valid email', isValidEmail),
    EMAIL_PASSWORD: yup.string().required(),
    EMAIL_FROM_NAME: yup.string().required(),
    EMAIL_FROM_ADDRESS: yup
      .string()
      .required()
      .test('valid-email', 'EMAIL_FROM_ADDRESS must be valid email', isValidEmail),

    // OTP Email configuration
    OTP_EMAIL_USER: yup.string().required().test('valid-email', 'OTP_EMAIL_USER must be valid email', isValidEmail),
    OTP_EMAIL_PASSWORD: yup.string().required(),

    // Support Email configuration
    SUPPORT_EMAIL_USER: yup
      .string()
      .required()
      .test('valid-email', 'SUPPORT_EMAIL_USER must be valid email', isValidEmail),
    SUPPORT_EMAIL_PASSWORD: yup.string().required(),

    BASE_URL: yup.string().optional(),
    SUPER_CACHE_PASSWORD: yup.string().optional(),

    FIREBASE_PROJECT_ID: yup.string().required(),
    FIREBASE_CLIENT_EMAIL: yup
      .string()
      .required()
      .test('valid-email', 'FIREBASE_CLIENT_EMAIL must be valid email', isValidEmail),
    FIREBASE_PRIVATE_KEY: yup.string().required(),

    // External APIs
    CARQUERY_API_URL: yup.string().optional(),
    CARQUERY_MODELS_URL: yup.string().optional(),

    // PAYMOB_BASE_URL: yup.string().required(),
    // PAYMOB_API_KEY: yup.string().required(),
  })
  .test({
    message: 'REDIS URL or REDIS_HOST and REDIS_PORT must be provided',
    test: (env) => {
      const hasRedisUrl = env.REDIS_URL && env.REDIS_URL.trim() !== '';
      const hasRedisHostAndPort =
        env.REDIS_HOST && env.REDIS_PORT && env.REDIS_HOST.trim() !== '' && env.REDIS_PORT.trim() !== '';
      return Boolean(hasRedisUrl || hasRedisHostAndPort);
    },
  });

export default environmentSchema;
