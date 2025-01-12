import envVars from '@src/config/environment';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcrypt';

export const encrypt = (text: string, key = envVars.auth.apiSalt): string => {
  return CryptoJS.AES.encrypt(text, key).toString();
};

export const decrypt = (text: string, key = envVars.auth.apiSalt): string => {
  return CryptoJS.AES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
};

export const generateHashedString = async (plainPassword: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return `${await bcrypt.hash(plainPassword, salt)}${envVars.passwordHashSeperator}${salt}`;
};

export const compareHashedString = async (hashedString: string, toCompareString: string): Promise<boolean> => {
  return await bcrypt.compare(toCompareString, hashedString.split(envVars.passwordHashSeperator)[0]);
};
