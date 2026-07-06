import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { MembersModule } from './modules/members/members.module';

@Module({
  imports: [PrismaModule, AuthModule, BusinessesModule, MembersModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
