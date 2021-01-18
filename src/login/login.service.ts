import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export interface ISignupData {
    email: string,
    password: string,
    firstName: string,
    lastName: string
}

@Injectable()
export class LoginService {

    public tokenValidityLengthMinutes = 10;
    private saltRounds = 10;
    private secret = 'abcd';
    
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
    
    async login(email: string, password: string) {
        const loginPromise = new Promise(async (resolve, reject) => {
            let users = [];

            try {
                const userPromise = this.userModel.find({ email: email });
                users = await userPromise;
            }
            catch (error) {
                reject('databaseError')
            }
    
            if (users.length == 0) {
                reject('userNotFound')
            }
            else if (users.length == 1) {
                bcrypt.compare(password, users[0].hash, async (err, result) => {
                    if (result == false) {
                        reject('passwordIncorrect')
                    }
                    else if (result == true) {
                        try {
                            const token = this.createToken(users[0]._id, users[0].currentKey);
                            resolve(token) 
                        }
                        catch (error) {
                            reject('tokenCreationError')
                        }
                    }
                })
            }
        });
        const loginResult = await loginPromise;
        return loginResult;
    }

    async createAccount(data: ISignupData) {
        const createPromise = new Promise<string>(async (resolve, reject) => {
            const email = data.email;
            const firstName = data.firstName;
            const lastName = data.lastName;
            let usersWithSameEmail = [];

            try {
                usersWithSameEmail = await this.userModel.find({email: email});
            }
            catch (error) {
                reject('databaseError') 
            }

            if (usersWithSameEmail.length != 0) {
                reject('userExists')
            }
            else {
                const currentKey = this.randomizeString(10);
                bcrypt.hash(data.password, this.saltRounds, async (hasherr, hash) => {
                    try {
                        const user = await this.userModel.create({
                            email: email,
                            hash: hash,
                            firstName: firstName,
                            lastName: lastName,
                            role: "client",
                            currentKey: currentKey
                        });
                        const token = this.createToken(user._id, user.currentKey);
                        resolve(token);
                    }
                    catch (error) {
                        reject('databaseError')
                    }
                })
            }
        });
        const result = await createPromise;
        return result;
    }

    async validate(tokenString: string) {
        const validationPromise = new Promise(async (resolve, reject) => {
            try {
                const decodedToken: any = jwt.verify(tokenString, this.secret);
                const user = await this.getUserInfo(decodedToken.userId);
                if (user.currentKey == decodedToken.currentKey) {
                    const newToken = this.createToken(user._id, user.currentKey);
                    resolve({
                        userData: {
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role
                        },
                        newToken: newToken
                    })
                }
                reject('keyError');
            }
            catch (error) {
                reject('tokenError');
            }
        })
        const result = await validationPromise;
        return result;
    }

    async getUserInfo(userId: string) {
        try {
            const userInfo = await this.userModel.findById(userId);
            return userInfo;
        }
        catch (error) {
            throw new Error('databaseError');
        }
    }

    createToken(userId: string, currentKey: string) {
        return jwt.sign({userId: userId, currentKey: currentKey}, this.secret, {expiresIn: this.tokenValidityLengthMinutes * 60});
    }

    randomizeString(length: number) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const stringArray = [];

        for(let i = 0; i < length; i++) {
            stringArray.push(characters[Math.floor(Math.random() * characters.length)]);
        }

        return stringArray.join('');
    }
}
