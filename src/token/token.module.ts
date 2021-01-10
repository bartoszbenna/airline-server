import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoginToken, LoginTokenSchema } from './schemas/loginToken.schema';
import { TokenService } from './token.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: LoginToken.name, schema: LoginTokenSchema }])],
    controllers: [],
    providers: [TokenService],
    exports: [TokenService]
})
export class TokenModule {}
