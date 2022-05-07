import { ApiProperty } from '@nestjs/swagger';

export class Flight {
  @ApiProperty()
  _id!: string;
  @ApiProperty()
  flightNumber!: string;
  @ApiProperty()
  depDate!: Date;
  @ApiProperty()
  arrDate!: Date;
  @ApiProperty()
  depCode!: string;
  @ApiProperty()
  arrCode!: string;
  @ApiProperty()
  planeType!: string;
  @ApiProperty()
  occupiedSeats!: string[];
  @ApiProperty()
  price!: number;
  @ApiProperty()
  adult!: number;
  @ApiProperty()
  child!: number;
  @ApiProperty()
  infant!: number;
}
