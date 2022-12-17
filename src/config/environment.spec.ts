import fs from 'fs';
import path from 'path';
import schema from './schema';

describe('config/environment.ts', () => {
  it('Should success if all process env values are present', () => {
    const envFile = fs.readFileSync(path.resolve(__dirname, '..', '..', '.env'), 'utf8');
    var env: any = {};
    envFile.replace(/(\w+)=(.+)/g, function ($0, $1, $2) {
      env[$1] = $2;
      return '';
    });
    const func = () => {
      schema.validateSync(env);
    };

    expect(func).not.toThrowError();
  });
  it('Should fail because not all env values are present', () => {
    const envFile = fs.readFileSync(path.resolve(__dirname, '..', '..', '.env'), 'utf8');
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
