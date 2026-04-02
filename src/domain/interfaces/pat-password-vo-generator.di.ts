import { PATPassword } from '../value-objects/pat-password.vo';

export interface IPATPasswordVOGeneratorInterface {
  createPATPasswordVO(patPassword: string): PATPassword;
}
