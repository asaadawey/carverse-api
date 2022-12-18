import * as yup from 'yup';

const environmentSchema = yup.object().shape({
  DATABASE_URL: yup.string().required(),
  HEROKU_POSTGRESQL_GREEN_URL: yup.string().required(),
  ORDER_TIMEOUT: yup.string().required(),
  PORT: yup.string().required(),
  APP_SECRET: yup.string().required(),
  APP_NAME: yup.string().required(),
  SKIP_AUTH: yup.string().required(),
  NODE_ENV: yup.string().required(),
  API_KEY: yup.string().required(),
  API_VALUE: yup.string().required(),
  AUTH_KEY: yup.string().required(),
});

export default environmentSchema;
