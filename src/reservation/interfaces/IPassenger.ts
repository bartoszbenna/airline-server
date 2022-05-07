import { PassengerType } from '../enums/PassengerType';

export interface IPassenger {
  type: PassengerType;
  firstName: string;
  lastName: string;
  dob: Date;
  handBaggage: number;
  checkedBaggage: number;
  seat: string;
  isCheckedIn: boolean;
  checkInDate?: Date;
  documentType?: string;
  documentNumber?: string;
}
