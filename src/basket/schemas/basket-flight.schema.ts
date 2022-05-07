import { FlightDocument } from 'src/search/schemas/flight.schema';

export class BasketFlightSchema {
  flightData!: FlightDocument;
  adult!: number;
  child!: number;
  infant!: number;
  unitPrice!: number;
}
