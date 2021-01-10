import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenModule } from 'src/token/token.module';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
    imports: [TokenModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    controllers: [LoginController],
    providers: [LoginService],
    exports: [LoginService]
})
export class LoginModule {}
