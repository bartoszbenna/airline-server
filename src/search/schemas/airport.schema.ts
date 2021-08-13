import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AirportDocument = Airport & Document;

@Schema()
export class Airport {
  @Prop()
  code!: string;

  @Prop()
  name!: string;

  @Prop()
  country!: string;

  @Prop()
  timezone!: number;
}

export const AirportSchema = SchemaFactory.createForClass(Airport);
