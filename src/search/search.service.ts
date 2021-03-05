import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { BasketService } from 'src/basket/basket.service';
import { Airport, AirportDocument } from './schemas/airport.schema';
import { Flight, FlightDocument } from './schemas/flight.schema';
import { SeatMap, SeatMapDocument } from './schemas/seatmap.schema';

export interface ISearchResult {
    flightNumber: string,
    depDate: Date,
    arrDate: Date,
    depCode: string,
    arrCode: string,
    price: number,
  }

export class SearchForm {
    oneWay: boolean
    departure: string
    arrival: string
    outDate: Date
    inDate: Date
    adult: number
    child: number
    infant: number
}

@Injectable()
export class SearchService {

    constructor(@InjectModel(Flight.name) private flightModel: Model<FlightDocument>,
                @InjectModel(Airport.name) private airportModel: Model<AirportDocument>,
                @InjectModel(SeatMap.name) private seatMapModel: Model<SeatMapDocument>,
                @Inject(forwardRef(() => BasketService)) private basketService: BasketService) {}

    async search(form: SearchForm) {
        await this.basketService.removeExpiredBaskets()
        const oneWay = form.oneWay;
        const depCode = form.departure;
        const arrCode = form.arrival;
        const outDate = form.outDate;
        const inDate = form.inDate;
        let minOutDate = moment.utc(new Date(outDate)).subtract(1, 'days').startOf('days');
        let maxOutDate = moment.utc(new Date(outDate)).add(1, 'days').endOf('days');
        let minInDate = moment.utc(new Date(inDate)).subtract(1, 'days').startOf('days');
        let maxInDate = moment.utc(new Date(inDate)).add(1, 'days').endOf('days');
        let inbounds: ISearchResult[] = [];
        let outbounds: ISearchResult[] = [];

        const outboundPromise = this.flightModel.find({
            depCode: depCode,
            arrCode: arrCode,
            depDate: {
                $gte: minOutDate.toDate(),
                $lte: maxOutDate.toDate()
            },
            available: {
                $gte: form.adult + form.child
            }
        });

        outbounds = await outboundPromise;

        if (!oneWay) {
            const inboundPromise = this.flightModel.find({
                depCode: arrCode,
                arrCode: depCode,
                depDate: {
                    $gte: minInDate.toDate(),
                    $lte: maxInDate.toDate()
                }
            });

            inbounds = await inboundPromise;
        }
        return {outbound: outbounds, inbound: inbounds}
    }

    async getAirports() {
        const airports = await this.airportModel.find();
        return airports;
    }
    
    async getFlightById(id: string) {
        const flightPromise = new Promise<FlightDocument>(async (resolve, reject) => {
            try {
                const flight = await this.flightModel.findById(id);
                if (flight == null || flight == undefined) {
                    reject('flightNotFound');
                }
                resolve(flight);
            }
            catch (error) {
                reject('databaseError');
            }
        })
        const result = await flightPromise;
        return result;
    }

    async changeAvailability(flightId: string, amount: number) {
        const flightPromise = new Promise<FlightDocument>(async (resolve, reject) => {
            try {
                const flight = await this.flightModel.findById(flightId);
                if (flight == null || flight == undefined) {
                    reject('flightNotFound');
                }
                else {
                    flight.available += amount;
                    resolve(await flight.save());
                }
            }
            catch (error) {
                reject('databaseError')
            }
        })
        const result = await flightPromise;
        return result;
    }

    async getSeatMap(type: string) {
        const seatMapPromise = new Promise<string[][]>(async (resolve, reject) => {
            try {
                const seatMap = await this.seatMapModel.findOne({type: type});
                if (seatMap == null) {
                    reject('notFound');
                    return;
                }
                else {
                    resolve(seatMap.seatMap);
                }
            }
            catch (error) {
                reject('databaseError');
            }
        })
        const result = await seatMapPromise;
        return result;
    }

    async getOccupiedSeats(id: string) {
        const seatsPromise = new Promise<string[]>(async (resolve, reject) => {
            try {
                const flight = await this.flightModel.findById(id);
                if (flight == null) {
                    reject('flightNotFound');
                }
                else {
                    resolve(flight.occupiedSeats);
                }
            }
            catch(error) {
                reject('databaseError');
            }
        });
        const result = await seatsPromise;
        return result;
    }

    async isSeatOccupied(flightId: string, seat: string) {
        const seatPromise = new Promise<boolean>(async (resolve, reject) => {
            try {
                const flight = await this.flightModel.findById(flightId);
                if (flight != null) {
                    resolve(flight.occupiedSeats.includes(seat));
                }
                else {
                    reject('flightNotFound');
                }
            }
            catch (error) {
                reject('databaseError');
            }
        })
        const result = await seatPromise;
        return result;
    }

    async changeSeatAvailability(flightId: string, seat: string, makeOccupied: boolean) {
        try {
            const flight = await this.flightModel.findById(flightId);
            if (flight == null) {
                return false;
            }
            if (makeOccupied) {
                if (flight.occupiedSeats.includes(seat)) {
                    return false;
                }
                flight.occupiedSeats.push(seat);
                flight.save()
                return true;
            }
            else {
                if (!flight.occupiedSeats.includes(seat)) {
                    return false;
                }
                flight.occupiedSeats.splice(flight.occupiedSeats.indexOf(seat), 1);
                flight.save()
                return true;
            }

        }
        catch(error) {
            return false;
        }
    }
}
