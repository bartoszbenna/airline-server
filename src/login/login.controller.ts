import { Controller, Post, Body, Get } from '@nestjs/common';
import { LoginService } from './login.service';

interface ILoginData {
    login: string;
    password: string;
}

@Controller('login')
export class LoginController {

    constructor(private loginService: LoginService) {}

    @Post()
    login(@Body() postData: ILoginData) {
        const login = postData.login;
        const pass = postData.password;
        
        return this.loginService.login(login, pass);
    }
}
