import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TokenService } from 'src/token/token.service';
import { ISignupData, LoginService } from './login.service';

interface ILoginData {
    email: string;
    password: string;
}

interface ITokenData {
    tokenString: string;
}

@Controller('login')
export class LoginController {

    constructor(private loginService: LoginService, private tokenService: TokenService) {}

    @Post('authorize')
    async login(@Body() data: ILoginData) {
        if (data.email == undefined || data.password == undefined) {
            throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.loginService.login(data.email, data.password);
            return result;
        }
        catch(error) {
            //possible errors: databaseError, userNotFound, passwordIncorrect, tokenCreationError
            if (error == 'userNotFound' || error == 'passwordIncorrect') {
                throw new HttpException('Invalid data', HttpStatus.UNAUTHORIZED)
            }
            else {
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    @Post('create')
    async create(@Body() data: ISignupData) {
        if (data.email == undefined || data.password == undefined || data.firstName == undefined || data.lastName == undefined) {
            throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.loginService.createAccount(data);
            console.log(result);
        }
        catch (error) {
            //possible errors: databaseError, userExists
            if (error == 'userExists') {
                throw new HttpException('User already exists', HttpStatus.CONFLICT)
            }
            else {
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    @Post('logout')
    async logout(@Body() data: ITokenData) {
        if (data.tokenString == undefined) {
            throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST)
        }
        try {
            this.tokenService.removeToken(data.tokenString);
        }
        catch (error) {
            //possible errors: databaseError
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @Post('validate')
    async validate(@Body() data: ITokenData) {
        if (data.tokenString == undefined) {
            throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST)
        }
        try {
            const token = await this.tokenService.getLoginToken(data.tokenString);
            if (token.length == 1) {
                const userData = await this.loginService.getUserInfo(token[0].userId);
                if (userData != undefined && userData != null) {
                    return {
                        email: userData.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        role: userData.role
                    }
                }
            }
            //invalid token or user does not exist
            throw new Error('invalidData')

        }
        catch (error) {
            //possible errors: databaseError
            console.log(error);
            if (error == 'invalidData') {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
            }
            else {
                throw new HttpException('Internal server error' + error, HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }
}
