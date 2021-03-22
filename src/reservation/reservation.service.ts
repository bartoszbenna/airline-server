import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BasketService } from 'src/basket/basket.service';
import { IFlight } from 'src/basket/schemas/basket.schema';
import { LoginService } from 'src/login/login.service';
import { SearchService } from 'src/search/search.service';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';

export interface IPassenger {
    type: string,
    firstName: string,
    lastName: string,
    dob: Date,
    handBaggage: number,
    checkedBaggage: number,
    seat: string
    isCheckedIn: boolean,
    checkInDate: Date,
    documentType: string,
    documentNumber: string,
}

export interface IReservedFlight {
    _id: string,
    flightNumber: string,
    depDate: Date,
    arrDate: Date,
    depCode: string,
    arrCode: string,
    price: number,
    passengers: IPassenger[]
}

export interface ISeat {
    flightId: string,
    seat: string
}

interface IPassengerData {
    type: string,
    firstName: string,
    lastName: string,
    dob: Date,
    handBaggage: number,
    checkedBaggage: number,
    seats: ISeat[]
}

export interface IReservationCreationData {
    basketId: string,
    passengers: IPassengerData[]
}

@Injectable()
export class ReservationService {

    private checkedBaggagePrice: number = 30;
    private handBaggagePrice: number = 10;
    private seatPrice: number = 10;

    constructor(
        @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
        private basketService: BasketService, 
        private loginService: LoginService,
        private searchService: SearchService) 
        {
            // run this every 5 minutes
            setInterval(() => {
                this.removeUnconfirmedReservations();
            }, 300000)
        }

    public async createNewReservation(data: IReservationCreationData, token: string) {
        const reservationCreationPromise = new Promise(async (resolve, reject) => {
            let decodedToken: any;
            try {
                decodedToken = this.loginService.decodeToken(token);
            }
            catch (error) {
                reject('invalidToken');
                return;
            }
            
            if (this.verifyResCreationData(data)) {
                try {
                    const basket = await this.basketService.getBasketById(data.basketId);
                    if (basket == undefined || basket == null) {
                        reject('invalidData');
                        return;
                    }
                    if (!this.verifyPaxNumber(data.passengers, basket.flights)) {
                        reject('invalidData');
                        return;
                    }
                    let errors: string[] = [];
                    const reservation: Reservation = {
                        reservationNumber: '',
                        userId: decodedToken.userId,
                        reservationDate: null,
                        flights: [],
                        totalPrice: 0,
                        isConfirmed: false,
                        payments: []
                    };
                    reservation.reservationNumber = await this.createReservationNumber();
                    reservation.reservationDate = new Date();
                    for (let flight of basket.flights) {
                        let passengers: IPassenger[] = [];
                        for (let passenger of data.passengers) {
                            const seatObject = passenger.seats.find(element => element.flightId == flight._id);
                            let seat: string = "";
                            if (seatObject != undefined && seatObject.seat != "") {
                                if (!(await this.searchService.isSeatOccupied(seatObject.flightId, seatObject.seat))) {
                                    if (await this.searchService.changeSeatAvailability(seatObject.flightId, seatObject.seat, true)) {
                                        seat = seatObject.seat;
                                    }
                                }
                                else {
                                    seat = '';
                                    if (!errors.includes('seats')) {
                                        errors.push('seats');
                                    }
                                }
                            }
                            passengers.push({
                                type: passenger.type,
                                firstName: passenger.firstName,
                                lastName: passenger.lastName,
                                dob: passenger.dob,
                                handBaggage: passenger.handBaggage,
                                checkedBaggage: passenger.checkedBaggage,
                                seat: seat,
                                isCheckedIn: false,
                                checkInDate: null,
                                documentType: null,
                                documentNumber: null,
                            })
                        }
                        const completeFlight = {
                            _id: flight._id,
                            flightNumber: flight.flightNumber,
                            depDate: flight.depDate,
                            arrDate: flight.arrDate,
                            depCode: flight.depCode,
                            arrCode: flight.arrCode,
                            price: flight.price,
                            passengers: passengers
                        }
                        reservation.flights.push(completeFlight);
                    }
                    for (let flight of reservation.flights) {
                        let passengers = 0;
                        for (let passenger of flight.passengers) {
                            if (passenger.type == 'adult' || passenger.type == 'child') {
                                passengers += 1;
                            }
                            reservation.totalPrice += passenger.checkedBaggage * this.checkedBaggagePrice;
                            reservation.totalPrice += (passenger.handBaggage - 1) * this.handBaggagePrice;
                            reservation.totalPrice += passenger.seat != "" ? this.seatPrice : 0;
                        }
                        reservation.totalPrice += flight.price * passengers;
                    }
                    const savedReservation = await this.reservationModel.create(reservation);
                    await this.basketService.removeBasket(basket._id, false);
                    resolve({
                        reservation: savedReservation,
                        errors: errors
                    });
                }
                catch (error) {
                    reject('databaseError');
                }
            }
            else {
                reject('invalidData');
            }
        })
        const result = await reservationCreationPromise;
        return result;
    }

    public async getReservations(token: string) {
        const reservationPromise = new Promise<ReservationDocument[]>(async (resolve, reject) => {
            let decodedToken: any;
            try {
                decodedToken = this.loginService.decodeToken(token);
            }
            catch (error) {
                reject('invalidToken');
            }
            try {
                const reservations = await this.reservationModel.find({userId: decodedToken.userId, isConfirmed: true});
                resolve(reservations);
            }
            catch (error) {
                reject('databaseError');
            }
        })
        const result = await reservationPromise;
        return result;
    }

    private verifyResCreationData(data: IReservationCreationData) {
        try {
            if (data == undefined) { return false }
            if (data.basketId == undefined || data.passengers == undefined) { return false }

            for (let passenger of data.passengers) {
                if (passenger.type == undefined || passenger.firstName == undefined || passenger.lastName == undefined ||
                    passenger.dob == undefined || passenger.handBaggage == undefined || passenger.checkedBaggage == undefined ||
                    passenger.seats == undefined) {
                        return false;
                    }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }

    private verifyPaxNumber(passengers: IPassengerData[], flights: IFlight[]) {
        try {
            let adult: number = 0;
            let child: number = 0;
            let infant: number = 0;
            for (let passenger of passengers) {
                if (passenger.type == 'adult') {
                    adult += 1;
                }
                else if (passenger.type == 'child') {
                    child += 1;
                }
                else if (passenger.type == 'infant') {
                    infant += 1;
                }
            }
            for (let flight of flights) {
                if (flight.adult != adult || flight.child != child || flight.infant != infant) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }

    private async createReservationNumber() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let number = '';
        for (let i = 0; i < 6; i++) {
            number += characters[Math.floor(Math.random() * 35)];
        }
        const existing = await this.reservationModel.find({reservationNumber: number})
        if (existing.length == 0) {
            return number;
        }
        else {
            return this.createReservationNumber();
        }
    }

    public async confirmReservation(reservationNumber: string) {
        const reservationConfirmationPromise = new Promise(async (resolve, reject) => {
            try {
                const reservation = await this.reservationModel.findOne({reservationNumber: reservationNumber});
                if (reservation != null) {
                    reservation.isConfirmed = true;
                    reservation.save();
                    resolve(reservation);
                }
                else {
                    reject('reservationNotFound')
                }
            }
            catch (error) {
                reject('databaseError');
            }
        })
        const result = await reservationConfirmationPromise;
        return result;
    }

    public async removeUnconfirmedReservations() {
        try {
            let expiryDate = new Date();
            expiryDate.setMinutes(expiryDate.getMinutes() - 30);
            const unconfirmedReservations = await this.reservationModel.find({reservationDate: {$lte: expiryDate}, isConfirmed: false});
            for (let res of unconfirmedReservations) {
                try {
                    for (let flight of res.flights) {
                        let paxNumber = 0;
                        for (let passenger of flight.passengers) {
                            if (passenger.type == 'adult' || passenger.type == 'child') {
                                paxNumber += 1;
                            }
                        }
                        await this.searchService.changeAvailability(flight._id, paxNumber);
                        for (let passenger of flight.passengers) {
                            if (passenger.seat != "") {
                                await this.searchService.changeSeatAvailability(flight._id, passenger.seat, false);
                            }
                        }
                    }
                    res.delete();
                }
                catch (error) {
                    console.log('Error while deleting unconfirmed reservations!')
                }
            }
        }
        catch(error) {
            console.log('Error while deleting unconfirmed reservations!')
        }
    }
}
