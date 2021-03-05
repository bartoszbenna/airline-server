import { Controller, Post, Body, Headers, HttpException, HttpStatus, Get, Patch } from '@nestjs/common';
import { IReservationCreationData, ReservationService } from './reservation.service';

@Controller('reservation')
export class ReservationController {

    constructor(private reservationService: ReservationService) {}

    @Post('create')
    async createReservation(@Body() data: IReservationCreationData, @Headers('x-access-token') token: string) {
        if (token == undefined) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        if (data == undefined) {
            throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.reservationService.createNewReservation(data, token);
            return result;
        }
        catch (error) {
            if (error == 'invalidToken') {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
            else if (error == 'invalidData') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
            }
            else {
                console.log(error);
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Get('get')
    async getReservations(@Headers('x-access-token') token: string) {
        if (token == undefined) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        try {
            const reservations = await this.reservationService.getReservations(token);
            return reservations;
        }
        catch(error) {
            if (error == 'invalidToken') {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
            else {
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Patch('confirm')
    async confirmReservation(@Body() body: any) {
        const reservationNumber = body.reservationNumber;
        if (reservationNumber == undefined) {
            throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
        }
        else {
            try {
                const updatedReservation = await this.reservationService.confirmReservation(reservationNumber);
                return updatedReservation;
            }
            catch (error) {
                if (error == 'reservationNotFound') {
                    throw new HttpException('Not found', HttpStatus.NOT_FOUND);
                }
                else {
                    throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
        }
    }
}
