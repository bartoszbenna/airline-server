import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FlightDocument = Flight & Document;

@Schema()
export class Flight {
  @Prop()
  flightNumber!: string;

  @Prop()
  depDate!: Date;

  @Prop()
  arrDate!: Date;

  @Prop()
  depCode!: string;

  @Prop()
  arrCode!: string;

  @Prop()
  planeType!: string;

  @Prop()
  price!: number;

  @Prop()
  available!: number;

  @Prop()
  occupiedSeats!: string[];

  @Prop()
  isOffer!: boolean;
}

export const FlightSchema = SchemaFactory.createForClass(Flight);
