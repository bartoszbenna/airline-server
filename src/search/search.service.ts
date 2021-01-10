import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { Airport, AirportDocument } from './schemas/airport.schema';
import { Flight, FlightDocument } from './schemas/flight.schema';

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
                @InjectModel(Airport.name) private airportModel: Model<AirportDocument>) {}

    async search(form: SearchForm) {
        const oneWay = form.oneWay;
        const depCode = form.departure;
        const arrCode = form.arrival;
        const outDate = form.outDate;
        const inDate = form.inDate;
        let minOutDate = moment(new Date(outDate)).subtract(1, 'days').startOf('days');
        let maxOutDate = moment(new Date(outDate)).add(1, 'days').endOf('days');
        let minInDate = moment(new Date(inDate)).subtract(1, 'days').startOf('days');
        let maxInDate = moment(new Date(inDate)).add(1, 'days').endOf('days');
        let inbounds: ISearchResult[] = [];
        let outbounds: ISearchResult[] = [];

        const outboundPromise = this.flightModel.find({
            depCode: depCode,
            arrCode: arrCode,
            depDate: {
                $gte: minOutDate.toDate(),
                $lte: maxOutDate.toDate()
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
}
