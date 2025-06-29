import { User } from '@prisma/client';

export interface AuthResponse {
  user: Omit<User, 'password' | 'tokenVerificationEmail' | 'tokenResetMotDePasse' | 'expirationResetMotDePasse'>;
  token: string;
}
