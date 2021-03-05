import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BasketModule } from 'src/basket/basket.module';
import { Airport, AirportSchema } from './schemas/airport.schema';
import { Flight, FlightSchema } from './schemas/flight.schema';
import { SeatMap, SeatMapSchema } from './schemas/seatmap.schema';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: Flight.name, schema: FlightSchema},
            {name: Airport.name, schema: AirportSchema},
            {name: SeatMap.name, schema: SeatMapSchema}]),
        forwardRef(() => BasketModule)],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService]
})
export class SearchModule {}
