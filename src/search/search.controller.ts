import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { SearchForm, SearchService } from './search.service';

@Controller('search')
export class SearchController {
    constructor(private searchService: SearchService) { }
    
    @Get('getResults')
    getResults(@Body() searchForm: SearchForm) {
        if (!(searchForm instanceof SearchForm)) {
            throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
        }
        else {
            try {
                return this.searchService.search(searchForm);
            }
            catch (error) {
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR)
            }
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

}
