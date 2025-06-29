import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { User, TypeDocument, StatutDocument } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}
  @Get()
  @Roles('COORDINATEUR', 'ADMINISTRATEUR',)
  @UseGuards(RolesGuard)
  async getAllDocumentsForPeriod(
    @CurrentUser() user: User,
  ) {
    const documents = await this.documentsService.getAllDocumentsForPeriod();  
    return {
      succes: true,
      donnees: documents,
    };
  }
  @Post('candidatures/:id/')
  @UseInterceptors(FileInterceptor('fichier'))
  async uploadDocument(
    @Param('id') candidatureId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() data: {
      type: TypeDocument;
      titre: string;
      description?: string;
      estObligatoire: string;
    },
    @CurrentUser() user: User,
  ) {
    const document = await this.documentsService.uploadDocument(
      candidatureId,
      file,
      {
        ...data,
        estObligatoire: data.estObligatoire === 'true',
      },
      user,
    );

    return {
      succes: true,
      donnees: { document },
    };
  }

  @Get('candidatures/:id/')
  async getCandidatureDocuments(
    @Param('id') candidatureId: string,
    @CurrentUser() user: User,
  ) {
    const documents = await this.documentsService.getCandidatureDocuments(candidatureId, user);

    return {
      succes: true,
      donnees: { documents },
    };
  }

  @Post(':id/verifier')
  @Roles('COORDINATEUR', 'ADMINISTRATEUR')
  @UseGuards(RolesGuard)
  async verifyDocument(
    @Param('id') documentId: string,
    @Body() data: { statut: StatutDocument; notes: string },
    @CurrentUser() user: User,
  ) {
    const verification = await this.documentsService.verifyDocument(
      documentId,
      data,
      user,
    );

    return {
      succes: true,
      donnees: { verification },
    };
  }

  @Delete(':id')
  async deleteDocument(
    @Param('id') documentId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.documentsService.deleteDocument(documentId, user);

    return {
      succes: true,
      donnees: result,
    };
  }
}
