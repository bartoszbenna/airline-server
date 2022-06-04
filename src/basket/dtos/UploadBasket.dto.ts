import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ValidateNested } from 'class-validator';
import { BasketFlightDto } from './BasketFlight.dto';

export class UploadBasketDto {
  @ApiProperty({ type: [BasketFlightDto] })
  @ArrayNotEmpty()
  @ValidateNested()
  flights!: BasketFlightDto[];
}
