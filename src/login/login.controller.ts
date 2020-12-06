import { Controller, Post, Body, Get } from '@nestjs/common';
import { LoginDto } from './login.dto';
import { LoginData } from './login.data';
import { TokenService } from 'src/token/token.service';

@Controller('login')
export class LoginController {
    loginData: object[];
    
    tokenValidityLength = 30;

    constructor(private tokenService: TokenService) {
        const dataClass = new LoginData();
        this.loginData = dataClass.getData();
    }

    @Post()
    login(@Body() postData: LoginDto) {
        const login = postData.login;
        const pass = postData.password;
        for (let i = 0; i < this.loginData.length; i++) {
            const data: any = this.loginData[i]
            if (data.login == login) {
                if (data.password == pass) {
                    const token = this.tokenService.createToken(data.role, this.tokenValidityLength);
                    return { tokenString: token.tokenString, role: token.role, validity: token.validity }
                }
                return { tokenString: '', role: '' }
            }
        }
        return { tokenString: '', role: '' };
    }
}
