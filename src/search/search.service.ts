import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { BasketService } from 'src/basket/basket.service';
import { Airport, AirportDocument } from './schemas/airport.schema';
import { Flight, FlightDocument } from './schemas/flight.schema';
import { SeatMap, SeatMapDocument } from './schemas/seatmap.schema';
import { DateTime } from 'luxon';
import { GetResultsDto } from './dtos/GetResults.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Flight.name) private flightModel: Model<FlightDocument>,
    @InjectModel(Airport.name) private airportModel: Model<AirportDocument>,
    @InjectModel(SeatMap.name) private seatMapModel: Model<SeatMapDocument>,
    @Inject(forwardRef(() => BasketService))
    private basketService: BasketService,
  ) {}

  public async search(
    form: GetResultsDto,
  ): Promise<{ outbound: FlightDocument[]; inbound?: FlightDocument[] }> {
    await this.basketService.removeExpiredBaskets();
    const oneWay = form.oneWay;
    const depCode = form.departure;
    const arrCode = form.arrival;
    const outDate = form.outDate;
    const inDate = form.inDate;
    let minOutDate = DateTime.fromISO(outDate)
      .toUTC()
      .minus({ days: 1 })
      .startOf('days');
    const maxOutDate = DateTime.fromISO(outDate)
      .toUTC()
      .plus({ days: 1 })
      .endOf('days');
    let minInDate = DateTime.fromISO(inDate)
      .toUTC()
      .minus({ days: 1 })
      .startOf('days');
    const maxInDate = DateTime.fromISO(inDate)
      .toUTC()
      .plus({ days: 1 })
      .endOf('days');

    if (minOutDate < DateTime.now()) {
      minOutDate = DateTime.now().startOf('days');
    }

    if (minInDate < minOutDate) {
      minInDate = minOutDate;
    }

    const outbounds = await this.flightModel.find({
      depCode: depCode,
      arrCode: arrCode,
      depDate: {
        $gte: minOutDate.toJSDate(),
        $lte: maxOutDate.toJSDate(),
      },
      available: {
        $gte: form.adult + form.child,
      },
    });

    if (oneWay) {
      return {
        outbound: outbounds,
      };
    }

    const inbounds = await this.flightModel.find({
      depCode: arrCode,
      arrCode: depCode,
      depDate: {
        $gte: minInDate.toJSDate(),
        $lte: maxInDate.toJSDate(),
      },
    });
    return { outbound: outbounds, inbound: inbounds };
  }

  public async getAirports(): Promise<AirportDocument[]> {
    return this.airportModel.find();
  }

  public async getFlightById(
    id: string,
    session?: ClientSession,
  ): Promise<FlightDocument | null> {
    return this.flightModel.findById(id).session(session ?? null);
  }

  public async changeAvailability(
    flightId: string,
    amount: number,
    session?: ClientSession,
  ): Promise<boolean> {
    try {
      const flight = await this.flightModel
        .findById(flightId)
        .session(session ?? null);
      if (flight) {
        const seatMap = await this.getSeatMap(flight.planeType, session);
        const maxAvailable = seatMap?.seatMap.length ?? 0;
        flight.available += amount;
        if (flight.available < 0 || flight.available > maxAvailable) {
          return false;
        }
        await flight.save(session ? { session } : undefined);
        return true;
      }
    } catch (err) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    throw new HttpException('Flight not found', HttpStatus.NOT_FOUND);
  }

  public async getSeatMap(
    type: string,
    session?: ClientSession,
  ): Promise<SeatMapDocument | null> {
    return this.seatMapModel.findOne({ type: type }).session(session ?? null);
  }

  public async getOccupiedSeats(id: string): Promise<FlightDocument | null> {
    return this.flightModel.findById(id);
  }

  public async isSeatOccupied(
    flightId: string,
    seat: string,
    session?: ClientSession,
  ): Promise<boolean> {
    try {
      const flight = await this.flightModel
        .findById(flightId)
        .session(session ?? null);
      if (flight) {
        return flight.occupiedSeats.includes(seat);
      }
    } catch (err) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    throw new HttpException('Flight not found', HttpStatus.NOT_FOUND);
  }

  public async changeSeatAvailability(
    flightId: string,
    seat: string,
    newOccupiedValue: boolean,
    session?: ClientSession,
  ): Promise<boolean> {
    try {
      const flight = await this.flightModel
        .findById(flightId)
        .session(session ?? null);
      if (flight) {
        if (newOccupiedValue) {
          if (flight.occupiedSeats.includes(seat)) {
            throw new HttpException(
              'Seat already occupied',
              HttpStatus.CONFLICT,
            );
          }
          flight.occupiedSeats.push(seat);
          await flight.save(session ? { session } : undefined);
          return true;
        }
        if (!flight.occupiedSeats.includes(seat)) {
          throw new HttpException('Seat not occupied', HttpStatus.CONFLICT);
        }
        flight.occupiedSeats.splice(flight.occupiedSeats.indexOf(seat), 1);
        await flight.save(session ? { session } : undefined);
        return true;
      }
      throw new HttpException('Flight not found', HttpStatus.NOT_FOUND);
    } catch (err) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getOffers(airportCode: string): Promise<FlightDocument[]> {
    return this.flightModel.find({
      depCode: airportCode,
      isOffer: true,
    });
  }

  // async setOffers() {
  //     const airports = await this.getAirports();
  //     for (let depAirport of airports) {
  //         for (let arrAirport of airports) {
  //             if (depAirport.code == arrAirport.code) {
  //                 continue;
  //             }
  //             const flights = await this.flightModel.find({depCode: depAirport.code, arrCode: arrAirport.code});
  //             let cheapestFight = flights.length != 0 ? flights[0] : null;
  //             for (let flight of flights) {
  //                 if (flight.price < cheapestFight.price) {
  //                     cheapestFight = flight;
  //                 }
  //             }
  //             cheapestFight.isOffer = true;
  //             await cheapestFight.save();
  //         }
  //     }
  // }
}
