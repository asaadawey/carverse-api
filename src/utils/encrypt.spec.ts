import { decrypt, encrypt } from './encrypt';

describe('encrypt.ts', () => {
  it('It should decrypt and decrypt', () => {
    const toEncrypt = 'this-is-a-test-value';
    const encryptedCipher = encrypt(toEncrypt);
    expect(decrypt(encryptedCipher)).toEqual(toEncrypt);
  });
});
