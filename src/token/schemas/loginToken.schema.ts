import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LoginTokenDocument = LoginToken & Document;

@Schema()
export class LoginToken {
    @Prop()
    userId: string;

    @Prop()
    token: string;

    @Prop()
    validity: Date;
}

export const LoginTokenSchema = SchemaFactory.createForClass(LoginToken);