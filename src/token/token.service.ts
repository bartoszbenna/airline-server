import { Injectable } from '@nestjs/common';
import { LoginToken, LoginTokenDocument } from './schemas/loginToken.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TokenService {

    constructor(@InjectModel(LoginToken.name) private loginTokenModel: Model<LoginTokenDocument>) {}

    async createToken(userId: string, validityLength: number) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const tokenArray = [];

        for(let i = 0; i < 20; i++) {
            tokenArray.push(characters[Math.floor(Math.random() * characters.length)]);
        }

        const tokenString = tokenArray.join('');

        const validity = new Date();
        validity.setMinutes(validity.getMinutes() + validityLength);

        let token = { 
            tokenString: tokenString,
            validity: validity,
            userId: userId
        }

        const existingSameTokens = await this.getLoginToken(token.tokenString);
        
        if (existingSameTokens.length != 0) {
            token = await this.createToken(userId, validityLength);
            return token;
        }
        else {
            this.loginTokenModel.create({userId: token.userId, token: token.tokenString, validity: token.validity});
            return token;
        }
    }

    async getLoginToken(tokenString: string) {
        try {
            const tokens = await this.loginTokenModel.find({token: tokenString})
            return tokens;
        }
        catch (error) {
            throw new Error('databaseError');
        }
    }

    async removeToken(tokenString: string) {
        try {
            await this.loginTokenModel.remove({token: tokenString});
        }
        catch (error) {
            throw new Error('databaseError');
        }
    }
}
