import { Module } from '@nestjs/common';
import { EntretiensController } from './entretiens.controller';
import { EntretiensService } from './entretiens.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EntretiensController],
  providers: [EntretiensService],
  exports: [EntretiensService],
})
export class EntretiensModule {}
