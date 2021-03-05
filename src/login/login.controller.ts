import { Controller, Post, Get, Body, Headers, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ISignupData, LoginService } from './login.service';

interface ILoginData {
    email: string;
    password: string;
}

@Controller('login')
export class LoginController {

    constructor(private loginService: LoginService) {}

    @Post('authorize')
    async login(@Body() data: ILoginData, @Res() response: Response) {
        if (data.email == undefined || data.password == undefined) {
            throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.loginService.login(data.email, data.password);
            response.cookie('token', result, {secure: true});
            response.send();
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
    async create(@Body() data: ISignupData, @Res() response: Response) {
        if (data.email == undefined || data.password == undefined || data.firstName == undefined || data.lastName == undefined) {
            throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.loginService.createAccount(data);
            response.cookie('token', result, {maxAge: this.loginService.tokenValidityLengthMinutes * 60000, secure: true});
            response.send();
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

    @Get('verify')
    async verifyToken(@Headers('x-access-token') accessToken: string, @Res() response: Response) {
        if (accessToken == undefined) {
            throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
        }
        else {
            try {
                const result: any = await this.loginService.validate(accessToken);
                response.cookie('token', result.newToken, {secure: true});
                response.send(result.userData);
            }
            catch (error) {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
        }
    }
}
