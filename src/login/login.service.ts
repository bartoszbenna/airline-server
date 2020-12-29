import { Injectable } from '@nestjs/common';
import { TokenService } from 'src/token/token.service';

interface ILoginData {
    login: string,
    password: string,
    role: string
}

export class LoginData {
    private data: ILoginData[] = [
        { login: "admin", password: "admin", role: "admin"},
        { login: "client", password: "client", role: "client"}
    ]

    getData() {
        return this.data;
    }
}

@Injectable()
export class LoginService {
    private tokenValidityLength = 30;
    
    constructor(private tokenService: TokenService) {}
    
    login(login: string, password: string) {
        const loginData = new LoginData().getData();

        for (let element of loginData) {
            const user: ILoginData = element;

            if (user.login == login) {
                if (user.password == password) {
                    const token = this.tokenService.createToken(user.role, this.tokenValidityLength);
                    return { tokenString: token.tokenString, role: token.role, validity: token.validity }
                }
                return { tokenString: '', role: '' }
            }
        }
        return { tokenString: '', role: '' };
    }
}
