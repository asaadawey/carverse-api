import { decrypt, encrypt, generateHashedString, compareHashedString } from './encrypt';

describe('encrypt.ts', () => {
  it('It should decrypt and decrypt', () => {
    const toEncrypt = 'this-is-a-test-value';
    const encryptedCipher = encrypt(toEncrypt);
    expect(decrypt(encryptedCipher)).toEqual(toEncrypt);
  });

  it('should generate a hashed string and validate it', async () => {
    const plain = 'myTestPassword!23';
    const hashed = await generateHashedString(plain);
    expect(typeof hashed).toBe('string');
    const ok = await compareHashedString(hashed, plain);
    expect(ok).toBe(true);
  });

  it('should fail comparison for wrong password', async () => {
    const plain = 'myTestPassword!23';
    const hashed = await generateHashedString(plain);
    const ok = await compareHashedString(hashed, 'wrongPassword');
    expect(ok).toBe(false);
  });
});
