import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmReservationDto {
  @ApiProperty({ description: 'Reservation number' })
  @IsString()
  reservationNumber!: string;
}
