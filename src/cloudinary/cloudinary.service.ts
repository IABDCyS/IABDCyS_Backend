import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CloudinaryResponse } from './types/cloudinary-response';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    } else {
      console.warn('Cloudinary configuration incomplete - file upload functionality will be disabled');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
    existingPublicId?: string,
  ): Promise<CloudinaryResponse> {
    if (!cloudinary.config().cloud_name) {
      throw new Error('Cloudinary is not configured');
    }

    // If there's an existing file, delete it first
    if (existingPublicId) {
      await this.deleteFile(existingPublicId);
    }

    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw',
          format:'pdf',
          use_filename:true,
          unique_filename: false,
          type:'upload',
          access_mode:'public'
        },
        (error, result: UploadApiResponse) => {
          if (error) return reject(error);
          resolve({
            asset_id: result.asset_id,
            public_id: result.public_id,
            version: result.version,
            signature: result.signature,
            width: result.width,
            height: result.height,
            format: result.format,
            resource_type: result.resource_type,
            created_at: result.created_at,
            bytes: result.bytes,
            type: result.type,
            url: result.url,
            secure_url: result.secure_url,
            original_filename: result.original_filename,
            api_key: result.api_key
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!cloudinary.config().cloud_name) {
      console.warn('Cloudinary not configured - skipping file deletion');
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
    }
  }
}
