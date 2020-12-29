import { Controller, Post, Body, Get, All } from '@nestjs/common';
import { TokenService } from './token.service';

class tokenStringDto {
    tokenString: string;
}

@Controller('token')
export class TokenController {

    constructor(private tokenService: TokenService) { }

    @Post('validate')
    validateToken(@Body() postData: tokenStringDto) {
        return {role: this.tokenService.getRole(postData.tokenString)};
    }

    @Post('logout')
    logout(@Body() postData: tokenStringDto) {
        this.tokenService.deleteToken(postData.tokenString);
    }

    @Get('getTokens')
    getAllTokens() {
        return this.tokenService.getTokens();
    }
}
