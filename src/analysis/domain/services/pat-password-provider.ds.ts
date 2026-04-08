import { PATPassword } from '../value-objects/pat-password.vo';
import { IPasswordProvider } from './interfaces/password-provider.ds.interface';

import { createHash } from 'crypto';

export class PATPasswordProvider implements IPasswordProvider {
  generate(password: string): PATPassword {
    if (!/(?=.*?[A-Z]).*/.test(password)) {
      throw new Error('Password must contain at least one capital letter');
    }

    if (!/(?=.*?[0-9]).*/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    return PATPassword.create(createHash('sha256').update(password).digest('hex'));
  }
}

export const PASSWORD_PROVIDER = Symbol('IPasswordProvider');
