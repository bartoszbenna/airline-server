import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetSeatMapDto {
  @ApiProperty({ description: 'Airplane type, e.g. B738' })
  @IsString()
  type!: string;
}
