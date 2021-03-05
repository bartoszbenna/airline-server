import { Query, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { SearchService } from './search.service';
import * as moment from 'moment';

@Controller('search')
export class SearchController {
    constructor(private searchService: SearchService) { }
    
    @Get('getResults')
    getResults(@Query() params) {
        try {
            const searchForm = {
                oneWay: params.oneWay == 'true',
                departure: params.departure,
                arrival: params.arrival,
                outDate: moment.utc(params.outDate).toDate(),
                inDate: moment.utc(params.inDate).toDate(),
                adult: Number(params.adult),
                child: Number(params.child),
                infant: Number(params.infant)
            }
            try {
                return this.searchService.search(searchForm);
            }
            catch (error) {
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
        catch(error) {
            throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
        }

    }

    @Get('getAirports')
    getAirports() {
        try {
            return this.searchService.getAirports();
        }
        catch (error) {
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    @Get('getSeatMap')
    async getSeatMap(@Query() params) {
        const type: string = params.type;
        if (type == undefined) {
            throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.searchService.getSeatMap(type.toUpperCase());
            return result;
        }
        catch (error) {
            if (error == 'notFound') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
            }
            else {
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Get('getOccupiedSeats')
    async getOccupiedSeats(@Query() params) {
        if (params.id == undefined || typeof params.id != 'string') {
            throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
        }
        else {
            try {
                return await this.searchService.getOccupiedSeats(params.id);
            }
            catch (error) {
                if (error == 'flightNotFound') {
                    throw new HttpException('Not found', HttpStatus.NOT_FOUND);
                }
                else {
                    throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
        }
    }
}
