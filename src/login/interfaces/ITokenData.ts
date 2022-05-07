import { JwtPayload } from 'jsonwebtoken';

export interface ITokenData extends JwtPayload {
  userId: string;
  currentKey: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}
