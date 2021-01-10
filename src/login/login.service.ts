import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenService } from 'src/token/token.service';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

interface ILoginData {
    email: string,
    password: string,
    role: string
}

export interface ISignupData {
    email: string,
    password: string,
    firstName: string,
    lastName: string
}

@Injectable()
export class LoginService {

    private tokenValidityLength = 2;
    private saltRounds = 10;
    
    constructor(private tokenService: TokenService,
        @InjectModel(User.name) private userModel: Model<UserDocument>) {}
    
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
                            const token = await this.tokenService.createToken(users[0]._id, this.tokenValidityLength);
                            resolve({ tokenString: token.tokenString, validity: token.validity }) 
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
                bcrypt.hash(data.password, this.saltRounds, (hasherr, hash) => {
                    this.userModel.create({email: email, hash: hash, firstName: firstName, lastName: lastName, role: "client"}, (createerr) => {
                        if (createerr == null && hasherr == null) {
                            resolve('success');
                        }
                        else {
                            reject('databaseError');
                        }
                    })
                })
            }
        });
        const result = await createPromise;
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
}
