import { PersonalAccessToken } from '../value-objects/personal-access-token.vo';

export interface IPersonalAccessTokenVoGeneratorInterface {
  createPersonalAccessTokenVO(patPassword: string): PersonalAccessToken;
}
