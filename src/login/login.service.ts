import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { SignupDataDto } from './dtos/SignupData.dto';
import { ITokenData } from './interfaces/ITokenData';

@Injectable()
export class LoginService {
  public tokenValidityLengthMinutes = 30;
  private saltRounds = 10;
  private secret = 'abcd';

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  public async login(email: string, password: string): Promise<string> {
    try {
      const users = await this.userModel.find({ email: email });
      if (users.length !== 1) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const user = users[0];
      if (await bcrypt.compare(password, user.hash)) {
        return this.createToken(users[0], users[0].currentKey);
      }
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async createAccount(data: SignupDataDto): Promise<string> {
    try {
      const usersWithSameEmail = await this.userModel.find({
        email: data.email,
      });
      if (usersWithSameEmail.length > 0) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }
      const newKey = this.randomizeString(10);
      const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);
      const user = await this.userModel.create({
        email: data.email,
        hash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'client',
        currentKey: newKey,
      });
      const token = this.createToken(user, user.currentKey);
      return token;
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async auth(token: string): Promise<string> {
    try {
      const user = await this.validateAndGetTokenInfo(token);
      if (user) {
        return this.createToken(user, user.currentKey);
      }
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async validateAndGetTokenInfo(token: string): Promise<UserDocument> {
    let decodedToken: ITokenData;
    try {
      if (token.startsWith('Bearer')) {
        token = token.slice(7);
      }
      decodedToken = jwt.verify(token, this.secret) as ITokenData;
    } catch (err) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const user = await this.getUserInfo(decodedToken.userId);
      if (user && user.currentKey == decodedToken.currentKey) {
        return user;
      }
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    } catch (err) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getUserInfo(userId: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findById(userId);
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private createToken(user: UserDocument, currentKey: string): string {
    const token: ITokenData = {
      userId: user.id,
      currentKey: currentKey,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
    return jwt.sign(token, this.secret, {
      expiresIn: this.tokenValidityLengthMinutes * 60,
    });
  }

  private randomizeString(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const stringArray = [];

    for (let i = 0; i < length; i++) {
      stringArray.push(
        characters[Math.floor(Math.random() * characters.length)],
      );
    }

    return stringArray.join('');
  }
}
