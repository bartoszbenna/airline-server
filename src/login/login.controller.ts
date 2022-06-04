import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDataDto } from './dtos/LoginData.dto';
import { SignupDataDto } from './dtos/SignupData.dto';
import { LoginService } from './login.service';

@ApiTags('login')
@ApiInternalServerErrorResponse()
@ApiUnauthorizedResponse()
@Controller('login')
export class LoginController {
  constructor(private loginService: LoginService) {}

  @Post('login')
  async login(@Body() data: LoginDataDto): Promise<string> {
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

  @ApiBearerAuth()
  @Get('auth')
  public async auth(
    @Headers('Authorization') accessToken: string,
  ): Promise<string> {
    if (!accessToken) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    try {
      const result = await this.loginService.auth(accessToken);
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
