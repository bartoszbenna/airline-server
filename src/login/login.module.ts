import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    controllers: [LoginController],
    providers: [LoginService],
    exports: [LoginService]
})
export class LoginModule {}
