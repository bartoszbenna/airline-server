import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDataDto } from './dtos/LoginData.dto';
import { SignupDataDto } from './dtos/SignupData.dto';
import { LoginService } from './login.service';

@ApiTags('login')
@Controller('login')
export class LoginController {
  constructor(private loginService: LoginService) {}

  @Post('authorize')
  async authorize(@Body() data: LoginDataDto): Promise<string> {
    try {
      return await this.loginService.login(data.email, data.password);
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

  @Post('create')
  async create(@Body() data: SignupDataDto): Promise<string> {
    try {
      return await this.loginService.createAccount(data);
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

  @Get('verify')
  public async verify(
    @Headers('Authorization') accessToken: string,
  ): Promise<string> {
    if (!accessToken) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    try {
      const result = await this.loginService.verify(accessToken);
      if (!result) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
