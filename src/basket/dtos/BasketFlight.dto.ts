import { ApiProperty } from '@nestjs/swagger';

export class BasketFlightDto {
  @ApiProperty()
  flightId!: string;
  @ApiProperty()
  adult!: number;
  @ApiProperty()
  child!: number;
  @ApiProperty()
  infant!: number;
}
