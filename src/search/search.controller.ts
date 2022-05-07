import {
  Query,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { GetOffersDto } from './dtos/GetOffers.dto';
import { GetResultsDto } from './dtos/GetResults.dto';
import { GetSeatMapDto } from './dtos/GetSeatMap.dto';
import { GetOccupiedSeatsDto } from './dtos/GetOccupiedSeats.dto';
import { ApiTags } from '@nestjs/swagger';
import { FlightDocument } from './schemas/flight.schema';
import { AirportDocument } from './schemas/airport.schema';
import { SeatMapDocument } from './schemas/seatmap.schema';

@Controller('search')
@ApiTags('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('getResults')
  public async getResults(@Query() params: GetResultsDto): Promise<{
    outbound: FlightDocument[];
    inbound?: FlightDocument[] | undefined;
  }> {
    try {
      return await this.searchService.search(params);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('getAirports')
  public async getAirports(): Promise<AirportDocument[]> {
    try {
      return await this.searchService.getAirports();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('getSeatMap/:type')
  public async getSeatMap(
    @Param() params: GetSeatMapDto,
  ): Promise<SeatMapDocument> {
    try {
      const result = await this.searchService.getSeatMap(params.type);
      if (result) {
        return result;
      }
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('getOccupiedSeats/:id')
  public async getOccupiedSeats(
    @Param() params: GetOccupiedSeatsDto,
  ): Promise<FlightDocument> {
    try {
      const result = await this.searchService.getOccupiedSeats(params.id);
      if (result) {
        return result;
      }
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('getOffers/:airport')
  public async getOffers(
    @Param() params: GetOffersDto,
  ): Promise<FlightDocument[]> {
    try {
      return await this.searchService.getOffers(params.airport);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Internal server error`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Get('setOffers')
  // async setOffers() {
  //     await this.searchService.setOffers();
  // }
}
