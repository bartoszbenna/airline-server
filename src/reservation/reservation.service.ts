import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
import { BasketService } from 'src/basket/basket.service';
import { BasketFlightSchema } from 'src/basket/schemas/basket-flight.schema';
import { LoginService } from 'src/login/login.service';
import { SearchService } from 'src/search/search.service';
import { CreateReservationDto } from './dto/CreateReservation.dto';
import { PassengerDataDto } from './dto/PassengerData.dto';
import { PassengerType } from './enums/PassengerType';
import { IPassenger } from './interfaces/IPassenger';
import { IReservedFlight } from './interfaces/IReservedFlight';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';

@Injectable()
export class ReservationService {
  private checkedBaggagePrice = 30;
  private handBaggagePrice = 10;
  private seatPrice = 10;

  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
    @InjectConnection()
    private mongoConnection: Connection,
    private basketService: BasketService,
    private loginService: LoginService,
    private searchService: SearchService,
  ) {
    // run this every 5 minutes
    setInterval(() => {
      this.removeUnconfirmedReservations();
    }, 5 * 60 * 1000);
  }

  public async createNewReservation(
    data: CreateReservationDto,
    token: string,
  ): Promise<ReservationDocument[]> {
    const userInfo = await this.loginService.validateAndGetTokenInfo(token);
    if (!userInfo) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (this.verifyResCreationData(data)) {
      const session = await this.mongoConnection.startSession();
      session.startTransaction();
      try {
        const basket = await this.basketService.getBasketById(
          data.basketId,
          session,
        );
        if (!basket) {
          throw new HttpException('Basket not found', HttpStatus.NOT_FOUND);
        }
        if (!this.verifyPaxNumber(data.passengers, basket.flights)) {
          throw new HttpException(
            'Invalid passenger data',
            HttpStatus.BAD_REQUEST,
          );
        }
        const reservation: Reservation = {
          reservationNumber: await this.createReservationNumber(session),
          userId: userInfo._id,
          reservationDate: new Date(),
          flights: [],
          totalPrice: 0,
          isConfirmed: false,
        };
        for (const flight of basket.flights) {
          const passengers: IPassenger[] = [];
          for (const passenger of data.passengers) {
            const seatObject = passenger.seats.find(
              (element) => element.flightId == flight.flightData._id,
            );
            if (seatObject) {
              const isOccupied = await this.searchService.isSeatOccupied(
                seatObject.flightId,
                seatObject.seat,
                session,
              );
              if (!isOccupied) {
                try {
                  await this.searchService.changeSeatAvailability(
                    seatObject.flightId,
                    seatObject.seat,
                    true,
                    session,
                  );
                } catch (error) {
                  throw new HttpException(
                    `Selected seat not available: ${seatObject.seat} for flight ${seatObject.flightId}`,
                    HttpStatus.BAD_REQUEST,
                  );
                }
              } else {
                throw new HttpException(
                  `Selected seat not available: ${seatObject.seat} for flight ${seatObject.flightId}`,
                  HttpStatus.BAD_REQUEST,
                );
              }
              passengers.push({
                type: passenger.type,
                firstName: passenger.firstName,
                lastName: passenger.lastName,
                dob: passenger.dob,
                handBaggage: passenger.handBaggage,
                checkedBaggage: passenger.checkedBaggage,
                seat: seatObject.seat,
                isCheckedIn: false,
              });
            }
          }
          const completeFlight: IReservedFlight = {
            flightData: flight.flightData._id,
            price: flight.unitPrice,
            passengers: passengers,
          };
          reservation.flights.push(completeFlight);
        }
        for (const flight of reservation.flights) {
          let passengers = 0;
          for (const passenger of flight.passengers) {
            if (
              passenger.type == PassengerType.Adult ||
              passenger.type == PassengerType.Child
            ) {
              passengers += 1;
            }
            reservation.totalPrice +=
              passenger.checkedBaggage * this.checkedBaggagePrice;
            reservation.totalPrice +=
              (passenger.handBaggage - 1) * this.handBaggagePrice;
            reservation.totalPrice += passenger.seat != '' ? this.seatPrice : 0;
          }
          reservation.totalPrice += flight.price * passengers;
        }
        const savedReservation = await this.reservationModel.create(
          [reservation],
          session ? { session } : undefined,
        );
        await this.basketService.removeBasket(basket._id, false, session);
        return savedReservation;
      } catch (error) {
        session.abortTransaction();
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } finally {
        session.endSession();
      }
    } else {
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }
  }

  public async getReservations(token: string): Promise<ReservationDocument[]> {
    const userData = await this.loginService.validateAndGetTokenInfo(token);
    if (!userData) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return this.reservationModel
      .find({
        userId: userData._id,
        isConfirmed: true,
      })
      .populate({
        path: 'flights.flightData',
        model: 'Flight',
      });
  }

  public async confirmReservation(
    token: string,
    reservationNumber: string,
  ): Promise<ReservationDocument> {
    const userData = await this.loginService.validateAndGetTokenInfo(token);
    if (!userData) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const reservation = await this.reservationModel.findOne({
      reservationNumber: reservationNumber,
      userId: userData._id,
    });
    if (reservation) {
      reservation.isConfirmed = true;
      return (await reservation.save()).populate({
        path: 'flights.flightData',
        model: 'Flight',
      });
    }
    throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
  }

  public async removeUnconfirmedReservations(): Promise<void> {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const earliestReservationDate = new Date();
      earliestReservationDate.setMinutes(
        earliestReservationDate.getMinutes() - 30,
      );
      const unconfirmedReservations = await this.reservationModel
        .find({
          reservationDate: { $lte: earliestReservationDate },
          isConfirmed: false,
        })
        .populate({
          path: 'flights.flightData',
          model: 'Flight',
        })
        .session(session);
      for (const res of unconfirmedReservations) {
        try {
          for (const flight of res.flights) {
            let paxNumber = 0;
            for (const passenger of flight.passengers) {
              if (
                passenger.type == PassengerType.Adult ||
                passenger.type == PassengerType.Child
              ) {
                paxNumber += 1;
              }
            }
            await this.searchService.changeAvailability(
              flight.flightData._id,
              paxNumber,
              session,
            );
            for (const passenger of flight.passengers) {
              if (passenger.seat != '') {
                await this.searchService.changeSeatAvailability(
                  flight.flightData._id,
                  passenger.seat,
                  false,
                  session,
                );
              }
            }
          }
          res.delete({ session });
        } catch (error) {
          console.log('Error while deleting unconfirmed reservations!');
        }
      }
      session.commitTransaction();
    } catch (error) {
      console.log('Error while deleting unconfirmed reservations!');
      session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  // TODO: implement dto checking in controller
  private verifyResCreationData(data: CreateReservationDto): boolean {
    try {
      if (data == undefined) {
        return false;
      }
      if (data.basketId == undefined || data.passengers == undefined) {
        return false;
      }

      for (const passenger of data.passengers) {
        if (
          passenger.type == undefined ||
          passenger.firstName == undefined ||
          passenger.lastName == undefined ||
          passenger.dob == undefined ||
          passenger.handBaggage == undefined ||
          passenger.checkedBaggage == undefined ||
          passenger.seats == undefined
        ) {
          return false;
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private verifyPaxNumber(
    passengers: PassengerDataDto[],
    flights: BasketFlightSchema[],
  ): boolean {
    let numberOfAdults = 0;
    let numberOfChildren = 0;
    let numberOfInfants = 0;
    for (const passenger of passengers) {
      switch (passenger.type) {
        case PassengerType.Adult:
          numberOfAdults++;
          break;
        case PassengerType.Child:
          numberOfChildren++;
          break;
        case PassengerType.Infant:
          numberOfInfants++;
          break;
        default:
          return false;
      }
    }
    for (const flight of flights) {
      if (
        flight.adult != numberOfAdults ||
        flight.child != numberOfChildren ||
        flight.infant != numberOfInfants
      ) {
        return false;
      }
    }
    return true;
  }

  private async createReservationNumber(
    session?: ClientSession,
  ): Promise<string> {
    let number = this.getRandomReservationNumber();
    const existing = await this.reservationModel
      .find({
        reservationNumber: number,
      })
      .session(session ?? null);
    if (existing.length == 0) {
      return number;
    }
    const existingNumbers = existing.map((n) => n.reservationNumber);
    for (let i = 0; i < 100 && existingNumbers.includes(number); i++) {
      number = this.getRandomReservationNumber();
    }
    return number;
  }

  private getRandomReservationNumber(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let number = '';
    for (let i = 0; i < 6; i++) {
      number += characters[Math.floor(Math.random() * 35)];
    }
    return number;
  }
}
