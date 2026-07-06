import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessesModule } from './modules/businesses/businesses.module';

@Module({
  imports: [PrismaModule, AuthModule, BusinessesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
