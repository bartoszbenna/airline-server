import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsString, ValidateNested } from 'class-validator';
import { PassengerDataDto } from './PassengerData.dto';

export class CreateReservationDto {
  @ApiProperty()
  @IsString()
  basketId!: string;

  @ApiProperty({ type: [PassengerDataDto] })
  @ArrayNotEmpty()
  @ValidateNested()
  passengers!: PassengerDataDto[];
}
