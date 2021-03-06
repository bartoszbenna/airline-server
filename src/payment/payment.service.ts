import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class PaymentService {

    constructor(@InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>) { }


}
