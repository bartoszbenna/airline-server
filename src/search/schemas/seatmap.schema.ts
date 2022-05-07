import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SeatMapDocument = Document & SeatMap;

@Schema()
export class SeatMap {
  @Prop()
  type!: string;

  @Prop()
  seatMap!: string[][];
}

export const SeatMapSchema = SchemaFactory.createForClass(SeatMap);
