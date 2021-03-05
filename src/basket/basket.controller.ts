import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post } from '@nestjs/common';
import { BasketService } from './basket.service';
import { IFlight } from './schemas/basket.schema';

@Controller('basket')
export class BasketController {

    constructor(private basketService: BasketService) {}

    @Get('getBasket')
    async getBasket(@Headers('x-access-token') token: string) {
        if (typeof token != 'string' || token == undefined) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        try {
            const basket = await this.basketService.getBasket(token);
            return basket;
        }
        catch (error) {
            if (error == 'invalidToken') {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
            else {
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Post('upload')
    async uploadBasket(@Headers('x-access-token') token: string, @Body() flights: IFlight[]) {
        if (typeof token != 'string' || token == undefined) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        try {
            const result = await this.basketService.uploadBasket(flights, token);
            return result;
        }
        catch (error) {
            if (error == 'invalidToken') {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
            if (error == 'flightNotAvailable') {
                throw new HttpException('FlightNotAvailable', HttpStatus.NOT_FOUND)
            }
            else if (error == 'flightNotFound' || error == 'invalidData') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
            }
            else {
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
}
