import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BasketFlightSchema } from './basket-flight.schema';

export type BasketDocument = Document & Basket;

@Schema()
export class Basket {
  @Prop()
  userId!: string;

  @Prop()
  flights!: BasketFlightSchema[];

  @Prop()
  expiryTime!: Date;
}

export const BasketSchema = SchemaFactory.createForClass(Basket);
