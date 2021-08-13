import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IPayment } from 'src/payment/schemas/payment.schema';
import { IReservedFlight } from '../reservation.service';

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

  @Prop()
  payments!: IPayment[];
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
