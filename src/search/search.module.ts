import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Airport, AirportSchema } from './schemas/airport.schema';
import { Flight, FlightSchema } from './schemas/flight.schema';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Flight.name, schema: FlightSchema}, {name: Airport.name, schema: AirportSchema}])],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService]
})
export class SearchModule {}
