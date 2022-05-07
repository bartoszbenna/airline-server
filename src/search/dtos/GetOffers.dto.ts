import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetOffersDto {
  @ApiProperty({ description: '3-letter airport code' })
  @IsString()
  airport!: string;
}
