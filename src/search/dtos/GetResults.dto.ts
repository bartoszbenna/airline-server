import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsString } from 'class-validator';

export class GetResultsDto {
  @ApiProperty()
  @IsBoolean()
  @Type(() => Boolean)
  oneWay!: boolean;

  @ApiProperty()
  @IsString()
  departure!: string;

  @ApiProperty()
  @IsString()
  arrival!: string;

  @ApiProperty()
  @IsDateString()
  outDate!: string;

  @ApiProperty()
  @IsDateString()
  inDate!: string;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  adult!: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  child!: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  infant!: number;
}
