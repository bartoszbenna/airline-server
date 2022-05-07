import { FlightDocument } from 'src/search/schemas/flight.schema';
import { IPassenger } from './IPassenger';

export interface IReservedFlight {
  flightData: FlightDocument;
  price: number;
  passengers: IPassenger[];
}
