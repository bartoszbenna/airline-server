import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SeatDto {
  @ApiProperty()
  @IsString()
  flightId!: string;

  @ApiProperty()
  @IsString()
  seat!: string;
}
