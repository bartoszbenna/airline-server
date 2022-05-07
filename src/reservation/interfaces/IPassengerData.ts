import { PassengerType } from '../enums/PassengerType';

export interface ISeat {
  flightId: string;
  seat: string;
}

export interface IPassengerData {
  type: PassengerType;
  firstName: string;
  lastName: string;
  dob: Date;
  handBaggage: number;
  checkedBaggage: number;
  seats: ISeat[];
}
