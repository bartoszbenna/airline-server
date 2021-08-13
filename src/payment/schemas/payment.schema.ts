import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IReservedFlight } from 'src/reservation/reservation.service';

export interface IPassengerIdentifier {
  firstName: string;
  lastName: string;
  dob: Date;
}

export interface IPaymentItem {
  name: string;
  price: number;
}

export interface IPaymentFlight extends IPaymentItem {
  flight: IReservedFlight;
}

export interface IPaymentSeat extends IPaymentItem {
  flightId: string;
  passenger: IPassengerIdentifier;
  seat: string;
}

export interface IPaymentBaggage extends IPaymentItem {
  flightId: string;
  passenger: IPassengerIdentifier;
  type: string;
}

export interface IPayment {
  _id: string;
  items: IPaymentItem[];
  totalPrice: number;
  transactionDate: Date;
}

export type PaymentDocument = Document & Payment;

@Schema()
export class Payment {
  @Prop()
  items!: IPaymentItem[];

  @Prop()
  totalPrice!: number;

  @Prop()
  transactionDate!: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
