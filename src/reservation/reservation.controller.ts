import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfirmReservationDto } from './dto/ConfirmReservation.dto';
import { CreateReservationDto } from './dto/CreateReservation.dto';
import { ReservationService } from './reservation.service';
import { ReservationDocument } from './schemas/reservation.schema';

@ApiTags('reservation')
@ApiBearerAuth()
@Controller('reservation')
export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  @Post('create')
  async createReservation(
    @Body() data: CreateReservationDto,
    @Headers('Authorization') token: string,
  ): Promise<ReservationDocument[]> {
    if (!token) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (!data) {
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }
    try {
      const result = await this.reservationService.createNewReservation(
        data,
        token,
      );
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

  @Get('get')
  async getReservations(
    @Headers('Authorization') token: string,
  ): Promise<ReservationDocument[]> {
    try {
      return await this.reservationService.getReservations(token);
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

  @Patch('confirm/:reservationNumber')
  async confirmReservation(
    @Headers('Authorization') token: string,
    @Param() params: ConfirmReservationDto,
  ): Promise<ReservationDocument> {
    try {
      return await this.reservationService.confirmReservation(
        token,
        params.reservationNumber,
      );
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
