import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BasketService } from './basket.service';
import { UploadBasketDto } from './dtos/UploadBasket.dto';
import { BasketDocument } from './schemas/basket.schema';

@ApiTags('basket')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@ApiUnauthorizedResponse()
@Controller('basket')
export class BasketController {
  constructor(private basketService: BasketService) {}

  @Get('getBasket')
  async getBasket(
    @Headers('Authorization') token: string,
  ): Promise<BasketDocument | null> {
    if (typeof token != 'string' || token == undefined) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return await this.basketService.getBasket(token);
  }

  @Post('upload')
  async uploadBasket(
    @Headers('Authorization') token: string,
    @Body() body: UploadBasketDto,
  ): Promise<BasketDocument> {
    const flights = body.flights;
    if (typeof token != 'string' || token == undefined) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return await this.basketService.uploadBasket(flights, token);
  }
}
