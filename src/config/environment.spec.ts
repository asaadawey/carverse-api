/*eslint-disable security/detect-non-literal-fs-filename */

import fs from 'fs';
import path from 'path';
import schema from './schema';

describe('config/environment.ts', () => {
  it('Should success if all process env values are present', () => {
    const envFile = fs.readFileSync(path.resolve(__dirname, '..', '..', '.env_test'), 'utf8');
    var env: any = {};
    envFile.replace(/(\w+)=(.+)/g, function ($0, $1, $2) {
      env[String($1)] = $2;
      return '';
    });

    // Override weak secrets for testing
    if (env.COOKIE_SECRET === 'N') {
      env.COOKIE_SECRET = 'test-strong-cookie-secret-32-chars-minimum';
    }
    if (env.APP_SECRET && env.APP_SECRET.length < 32) {
      env.APP_SECRET = 'test-strong-app-secret-32-chars-minimum';
    }

    const func = () => {
      schema.validateSync(env);
    };

    expect(func).not.toThrowError();
  });
  it('Should fail because not all env values are present', () => {
    const envFile = fs.readFileSync(path.resolve(__dirname, '..', '..', '.env_test'), 'utf8');
    var env: any = {};
    envFile.replace(/(\w+)=(.+)/g, function ($0, $1, $2) {
      env[$1 + 'NOT_RIGHT_VALUE'] = $2;
      return '';
    });
    const func = () => {
      schema.validateSync(env);
    };

    expect(func).toThrowError();
  });
});
