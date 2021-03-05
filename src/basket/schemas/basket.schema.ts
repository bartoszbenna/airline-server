import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface IFlight {
    _id: string,
    flightNumber: string,
    depDate: Date,
    arrDate: Date,
    depCode: string,
    arrCode: string,
    planeType: string,
    occupiedSeats: string[],
    price: number,
    adult: number,
    child: number,
    infant: number
  }

export type BasketDocument = Document & Basket;

@Schema()
export class Basket {
    @Prop()
    userId: string;

    @Prop()
    flights: IFlight[];

    @Prop()
    expiryTime: Date;

    @Prop()
    totalPrice: number;
}

export const BasketSchema = SchemaFactory.createForClass(Basket);