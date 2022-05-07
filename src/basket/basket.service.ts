import {
  Inject,
  Injectable,
  forwardRef,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection, ClientSession } from 'mongoose';
import { LoginService } from 'src/login/login.service';
import { SearchService } from 'src/search/search.service';
import { BasketFlightDto } from './dtos/BasketFlight.dto';
import { Basket, BasketDocument } from './schemas/basket.schema';

@Injectable()
export class BasketService {
  private basketExpiryTimeMinutes = 15;

  constructor(
    private loginService: LoginService,
    @Inject(forwardRef(() => SearchService))
    private searchService: SearchService,
    @InjectModel(Basket.name) private basketModel: Model<BasketDocument>,
    @InjectConnection() private mongoConnection: Connection,
  ) {}

  public async getBasket(token: string): Promise<BasketDocument | null> {
    try {
      const userInfo = await this.loginService.validateAndGetTokenInfo(token);
      if (!userInfo) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const basket = await this.basketModel
        .findOne({
          userId: userInfo._id,
        })
        .populate({
          path: 'flights.flightData',
          model: 'Flight',
        });
      if (basket) {
        if (basket.expiryTime < new Date()) {
          await this.removeBasket(basket.id, true);
        } else {
          return basket;
        }
      }
      return await this.createBasket(userInfo._id);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getBasketById(
    id: string,
    session?: ClientSession,
  ): Promise<BasketDocument | null> {
    try {
      return await this.basketModel
        .findById(id)
        .populate({
          path: 'flights.flightData',
          model: 'Flight',
        })
        .session(session ?? null);
    } catch (error) {
      return null;
    }
  }

  public async createBasket(userId: string): Promise<BasketDocument | null> {
    try {
      const expiryTime = new Date();
      expiryTime.setMinutes(
        expiryTime.getMinutes() + this.basketExpiryTimeMinutes,
      );

      return await this.basketModel.create({
        userId: userId,
        flights: [],
        expiryTime: expiryTime,
        totalPrice: 0,
      });
    } catch (err) {
      return null;
    }
  }

  public async uploadBasket(
    flights: BasketFlightDto[],
    token: string,
  ): Promise<BasketDocument> {
    try {
      const basket = await this.getBasket(token);
      if (!basket) {
        throw new HttpException('Basket not found', HttpStatus.NOT_FOUND);
      }

      const session = await this.mongoConnection.startSession();
      try {
        session.startTransaction();
        // Change availability on flights already in basket
        if (basket.flights.length != 0) {
          for (const flight of basket.flights) {
            await this.searchService.changeAvailability(
              flight.flightData._id,
              flight.adult + flight.child,
            );
          }
        }

        // Reset basket
        basket.flights = [];

        for (const flight of flights) {
          if (!this.checkFlightFormat(flight)) {
            throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
          }

          const dbFlight = await this.searchService.getFlightById(
            flight.flightId,
            session,
          );

          if (!dbFlight) {
            throw new HttpException('Flight not found', HttpStatus.NOT_FOUND);
          }

          if (dbFlight.available < flight.adult + flight.child) {
            throw new HttpException(
              'Flight not available',
              HttpStatus.CONFLICT,
            );
          }

          // Reserve availability for selected flights
          await this.searchService.changeAvailability(
            dbFlight._id,
            (flight.adult + flight.child) * -1,
            session,
          );

          basket.flights.push({
            flightData: dbFlight._id,
            adult: flight.adult,
            child: flight.child,
            infant: flight.infant,
            unitPrice: dbFlight.price,
          });
        }

        const expiryTime = new Date();
        expiryTime.setMinutes(
          expiryTime.getMinutes() + this.basketExpiryTimeMinutes,
        );
        basket.expiryTime = expiryTime;
        await basket.save({ session });
        await session.commitTransaction();
        return basket.populate({
          path: 'flights.flightData',
          model: 'Flight',
        });
      } catch (err) {
        await session.abortTransaction();
        if (err instanceof HttpException) {
          throw err;
        }
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } finally {
        session.endSession();
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async removeBasket(
    id: string,
    changeAvailability: boolean,
    session?: ClientSession,
  ): Promise<boolean> {
    try {
      const basket = await this.getBasketById(id, session);
      if (basket) {
        if (changeAvailability) {
          for (const flight of basket.flights) {
            await this.searchService.changeAvailability(
              flight.flightData._id,
              flight.adult + flight.child,
              session,
            );
          }
        }
        await basket.remove(session ? { session } : undefined);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // TODO: remove this
  public async removeExpiredBaskets() {
    try {
      const expiredBaskets = await this.basketModel.find({
        expiryTime: { $lte: new Date() },
      });
      for (const basket of expiredBaskets) {
        for (const flight of basket.flights) {
          try {
            await this.searchService.changeAvailability(
              flight.flightData._id,
              flight.adult + flight.child,
            );
          } catch (error) {
            continue;
          }
        }
        await basket.remove();
      }
    } catch (error) {
      console.log('removeExpiredBaskets error! message: ' + error);
    }
  }

  private checkFlightFormat(flight: BasketFlightDto) {
    if (flight.flightId == undefined || typeof flight.flightId != 'string') {
      return false;
    }
    if (flight.adult == undefined || typeof flight.adult != 'number') {
      return false;
    }
    if (flight.child == undefined || typeof flight.child != 'number') {
      return false;
    }
    if (flight.infant == undefined || typeof flight.infant != 'number') {
      return false;
    }
    return true;
  }
}
