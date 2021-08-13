import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchModule } from './search/search.module';
import { LoginModule } from './login/login.module';
import { BasketModule } from './basket/basket.module';
import { ReservationModule } from './reservation/reservation.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb+srv://admin:admin@airline-cluster.m0nwy.mongodb.net/airline?retryWrites=true&w=majority'), SearchModule, LoginModule, BasketModule, ReservationModule, PaymentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
