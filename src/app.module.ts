import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginController } from './login/login.controller';
import { TokenService } from './token/token.service';
import { TokenController } from './token/token.controller';
import { LoginService } from './login/login.service';

@Module({
  imports: [],
  controllers: [AppController, LoginController, TokenController],
  providers: [AppService, TokenService, LoginService],
})
export class AppModule {}
