import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PassengerType } from '../enums/PassengerType';
import { SeatDto } from './Seat.dto';

export class PassengerDataDto {
  @ApiProperty({ enum: PassengerType })
  @IsEnum(PassengerType)
  type!: PassengerType;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty()
  @IsDate()
  dob!: Date;

  @ApiProperty()
  @IsInt()
  handBaggage!: number;

  @ApiProperty()
  @IsInt()
  checkedBaggage!: number;

  @ApiProperty({ type: [SeatDto] })
  @ValidateNested()
  seats!: SeatDto[];
}
