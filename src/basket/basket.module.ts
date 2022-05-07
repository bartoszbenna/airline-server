import { forwardRef, Module } from '@nestjs/common';
import { BasketService } from './basket.service';
import { BasketController } from './basket.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Basket, BasketSchema } from './schemas/basket.schema';
import { LoginModule } from 'src/login/login.module';
import { SearchModule } from 'src/search/search.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Basket.name, schema: BasketSchema }]),
    LoginModule,
    forwardRef(() => SearchModule),
  ],
  providers: [BasketService],
  controllers: [BasketController],
  exports: [BasketService],
})
export class BasketModule {}
