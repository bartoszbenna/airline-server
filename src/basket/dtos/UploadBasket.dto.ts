import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty } from 'class-validator';
import { BasketFlightDto } from './BasketFlight.dto';

export class UploadBasketDto {
  @ApiProperty({ type: [BasketFlightDto] })
  @ArrayNotEmpty()
  flights!: BasketFlightDto[];
}
