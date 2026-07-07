import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { MembersModule } from './modules/members/members.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BusinessesModule,
    MembersModule,
    OnboardingModule,
    WorkflowModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
