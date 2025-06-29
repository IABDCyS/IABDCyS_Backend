import { Module } from '@nestjs/common';
import { PeriodesService } from './periodes.service';
import { PeriodesController } from './periodes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PeriodesController],
  providers: [PeriodesService],
  exports: [PeriodesService],
})
export class PeriodesModule {}
