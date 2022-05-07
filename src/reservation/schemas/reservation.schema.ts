import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { IReservedFlight } from '../interfaces/IReservedFlight';

export type ReservationDocument = Document & Reservation;

@Schema()
export class Reservation {
  @Prop()
  reservationNumber!: string;

  @Prop()
  userId!: string;

  @Prop()
  reservationDate!: Date;

  @Prop()
  flights!: IReservedFlight[];

  @Prop()
  totalPrice!: number;

  @Prop()
  isConfirmed!: boolean;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
