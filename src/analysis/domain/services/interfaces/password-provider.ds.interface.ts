import { PATPassword } from '../../value-objects/pat-password.vo';

export interface IPasswordProvider {
  generate(password: string): PATPassword;
}
