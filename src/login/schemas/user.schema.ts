import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop()
    email: string;

    @Prop()
    hash: string;

    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop()
    role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);