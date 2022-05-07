import { IPassengerData } from './IPassengerData';

export interface IReservationCreationData {
  basketId: string;
  passengers: IPassengerData[];
}
