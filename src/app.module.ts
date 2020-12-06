import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginController } from './login/login.controller';
import { TokenService } from './token/token.service';
import { TokenController } from './token/token.controller';

@Module({
  imports: [],
  controllers: [AppController, LoginController, TokenController],
  providers: [AppService, TokenService],
})
export class AppModule {}
