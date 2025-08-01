import { PasswordService } from '../../services/passwordService';

describe('PasswordService', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123';
      const hashedPassword = await PasswordService.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await PasswordService.hashPassword(password);
      const hash2 = await PasswordService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(PasswordService.hashPassword('')).rejects.toThrow();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await PasswordService.hashPassword(password);
      
      const isValid = await PasswordService.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashedPassword = await PasswordService.hashPassword(password);
      
      const isValid = await PasswordService.verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle malformed hash', async () => {
      const password = 'testPassword123';
      const malformedHash = 'invalid-hash';
      
      const isValid = await PasswordService.verifyPassword(password, malformedHash);
      expect(isValid).toBe(false);
    });
  });
});