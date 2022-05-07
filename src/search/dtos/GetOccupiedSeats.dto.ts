import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetOccupiedSeatsDto {
  @ApiProperty({ description: 'Flight id' })
  @IsString()
  id!: string;
}
