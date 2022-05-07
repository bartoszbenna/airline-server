import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchModule } from './search/search.module';
import { LoginModule } from './login/login.module';
import { BasketModule } from './basket/basket.module';
import { ReservationModule } from './reservation/reservation.module';
import { ValidationPipe } from './shared/pipes/validation.pipe';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      (() => {
        const url = process.env.DATABASE_URL;
        const username = process.env.DATABASE_USER;
        const password = process.env.DATABASE_PASSWORD;
        if (!url || !username || !password) {
          return '';
        }
        let connectionString = url.replace('<<DATABASE_USER>>', username);
        connectionString = connectionString.replace(
          '<<DATABASE_PASSWORD>>',
          password,
        );
        return connectionString;
      })(),
    ),
    SearchModule,
    LoginModule,
    BasketModule,
    ReservationModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_PIPE, useClass: ValidationPipe }],
})
export class AppModule {}
