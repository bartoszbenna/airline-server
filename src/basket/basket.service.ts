import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginService } from 'src/login/login.service';
import { UserDocument } from 'src/login/schemas/user.schema';
import { SearchService } from 'src/search/search.service';
import { Basket, BasketDocument, IFlight } from './schemas/basket.schema';

@Injectable()
export class BasketService {
  private basketExpiryTimeInMinutes: number = 15;

  constructor(
    private loginService: LoginService,
    @Inject(forwardRef(() => SearchService))
    private searchService: SearchService,
    @InjectModel(Basket.name) private basketModel: Model<BasketDocument>,
  ) {}

  public async getBasket(token: string) {
    const basketPromise = new Promise<BasketDocument>(
      async (resolve, reject) => {
        let tokenPayload: any;
        try {
          tokenPayload = this.loginService.decodeToken(token);
        } catch (error) {
          reject('invalidToken');
          return;
        }
        let matchingUser: UserDocument | null;
        try {
          matchingUser = await this.loginService.getUserInfo(
            tokenPayload.userId,
          );
        } catch (error) {
          reject('databaseError');
          return;
        }
        if (
          matchingUser != null &&
          matchingUser != undefined &&
          tokenPayload.currentKey == matchingUser.currentKey
        ) {
          let existingBasket: BasketDocument | null;
          try {
            existingBasket = await this.basketModel.findOne({
              userId: matchingUser._id,
            });
          } catch (error) {
            reject('databaseError');
            return;
          }
          if (existingBasket != null && existingBasket != undefined) {
            if (existingBasket.expiryTime > new Date()) {
              resolve(existingBasket);
              return;
            } else {
              for (let flight of existingBasket.flights) {
                await this.searchService.changeAvailability(
                  flight._id,
                  flight.adult + flight.child,
                );
              }
              await existingBasket.remove();
            }
          }
          try {
            const basket = await this.createBasket(matchingUser._id);
            resolve(basket);
            return;
          } catch (error) {
            reject('databaseError');
            return;
          }
        }
      },
    );
    const result = await basketPromise;
    return result;
  }

  public async getBasketById(id: string) {
    try {
      const basket = await this.basketModel.findById(id);
      return basket;
    } catch (error) {
      return undefined;
    }
  }

  public async createBasket(userId: string) {
    const basketCreationPromise = new Promise<BasketDocument>(
      async (resolve, reject) => {
        const expiryTime = new Date();
        expiryTime.setMinutes(
          expiryTime.getMinutes() + this.basketExpiryTimeInMinutes,
        );
        try {
          const basket = await this.basketModel.create({
            userId: userId,
            flights: [],
            expiryTime: expiryTime,
            totalPrice: 0,
          });
          resolve(basket);
        } catch (error) {
          reject('databaseError');
        }
      },
    );
    const result = await basketCreationPromise;
    return result;
  }

  public async uploadBasket(flights: IFlight[], token: string) {
    await this.removeExpiredBaskets();
    const basketAdditionPromise = new Promise<BasketDocument>(
      async (resolve, reject) => {
        let basket: BasketDocument;
        try {
          basket = await this.getBasket(token);
        } catch (error) {
          if (error == 'invalidToken' || error == 'databaseError') {
            reject(error);
            return;
          } else {
            reject('databaseError');
            return;
          }
        }
        if (basket.flights.length != 0) {
          try {
            for (let flight of basket.flights) {
              await this.searchService.changeAvailability(
                flight._id,
                flight.adult + flight.child,
              );
            }
          } catch (error) {
            reject('databaseError');
            return;
          }
        }
        basket.flights = [];
        basket.totalPrice = 0;
        try {
          for (let flight of flights) {
            if (!this.checkFlightFormat(flight)) {
              reject('invalidData');
              return;
            }
            try {
              const verifiedFlight = await this.searchService.getFlightById(
                flight._id,
              );
              if (verifiedFlight.available < flight.adult + flight.child) {
                reject('flightNotAvailable');
              } else {
                await this.searchService.changeAvailability(
                  verifiedFlight._id,
                  (flight.adult + flight.child) * -1,
                );
                basket.flights.push({
                  _id: verifiedFlight._id,
                  flightNumber: verifiedFlight.flightNumber,
                  depDate: verifiedFlight.depDate,
                  arrDate: verifiedFlight.arrDate,
                  depCode: verifiedFlight.depCode,
                  arrCode: verifiedFlight.arrCode,
                  planeType: verifiedFlight.planeType,
                  occupiedSeats: verifiedFlight.occupiedSeats,
                  price: verifiedFlight.price,
                  adult: flight.adult,
                  child: flight.child,
                  infant: flight.infant,
                });
                basket.totalPrice +=
                  (flight.adult + flight.child + flight.infant) *
                  verifiedFlight.price;
              }
            } catch (error) {
              if (error == 'flightNotFound') {
                reject('flightNotFound');
                return;
              } else {
                reject('databaseError');
                return;
              }
            }
          }
        } catch (error) {
          reject('invalidData');
          return;
        }
        try {
          const expiryTime = new Date();
          expiryTime.setMinutes(
            expiryTime.getMinutes() + this.basketExpiryTimeInMinutes,
          );
          basket.expiryTime = expiryTime;
          const newBasket = await basket.save();
          resolve(newBasket);
          return;
        } catch (error) {
          reject('databaseError');
          return;
        }
      },
    );
    const result = await basketAdditionPromise;
    return result;
  }

  private checkFlightFormat(flight: IFlight) {
    if (flight._id == undefined || typeof flight._id != 'string') {
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

  public async removeBasket(id: string, changeAvailability: boolean) {
    try {
      const basket = await this.getBasketById(id);
      if (basket != undefined && basket != null) {
        if (changeAvailability) {
          for (let flight of basket.flights) {
            await this.searchService.changeAvailability(
              flight._id,
              flight.adult + flight.child,
            );
          }
        }
        await basket.remove();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async removeExpiredBaskets() {
    try {
      const expiredBaskets = await this.basketModel.find({
        expiryTime: { $lte: new Date() },
      });
      for (let basket of expiredBaskets) {
        for (let flight of basket.flights) {
          try {
            await this.searchService.changeAvailability(
              flight._id,
              flight.adult + flight.child,
            );
          } catch (error) {
            // shit happens, we need to continue
          }
        }
        await basket.remove();
      }
    } catch (error) {
      console.log('removeExpiredBaskets error! message: ' + error);
    }
    return;
  }
}
