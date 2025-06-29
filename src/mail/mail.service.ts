import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface EmailRecipient {
  email: string;
  name: string;
}

interface EmailParams {
  to: EmailRecipient[];
  templateId: number;
  params: Record<string, any>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';
  private readonly fromEmail: { name: string; email: string };

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('BREVO_API_KEY is not configured - email functionality will be disabled');
      // Don't throw error, just log warning
    }

    this.fromEmail = {
      email: this.configService.get<string>('SMTP_FROM') || 'mohamedabdellahibabana@gmail.com',
      name: 'Student Application System',
    };

    // Log configuration for debugging
    this.logger.log(`Brevo API URL: ${this.brevoApiUrl}`);
  }

  private async sendTemplateEmail(params: EmailParams): Promise<void> {
    try {
      if (!this.apiKey) {
        this.logger.warn('Email sending skipped - BREVO_API_KEY not configured');
        return;
      }

      const payload = {
        sender: this.fromEmail,
        to: params.to,
        templateId: params.templateId,
        params: params.params
      };

      this.logger.log(`Attempting to send email to ${params.to.map(t => t.email).join(', ')}`);
      this.logger.log(`Using template ID: ${params.templateId}`);
      this.logger.log(`Sender: ${this.fromEmail.name} <${this.fromEmail.email}>`);

      const response = await axios.post(this.brevoApiUrl, payload, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      // Log the full response for debugging
      this.logger.log(`Brevo API Response Status: ${response.status}`);
      this.logger.log(`Brevo API Response Data: ${JSON.stringify(response.data)}`);

      if (response.status === 201 || response.status === 200) {
        this.logger.log(`Email sent successfully to ${params.to.map(t => t.email).join(', ')}`);
        this.logger.log(`Message ID: ${response.data?.messageId || 'N/A'}`);
      } else {
        this.logger.warn(`Unexpected response status: ${response.status}`);
        this.logger.warn(`Response data: ${JSON.stringify(response.data)}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${params.to.map(t => t.email).join(', ')}`);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(`Brevo API Error Status: ${error.response.status}`);
        this.logger.error(`Brevo API Error Data: ${JSON.stringify(error.response.data)}`);
        this.logger.error(`Brevo API Error Headers: ${JSON.stringify(error.response.headers)}`);
      } else if (error.request) {
        // The request was made but no response was received
        this.logger.error('No response received from Brevo API');
        this.logger.error(`Request details: ${JSON.stringify(error.request)}`);
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error(`Error setting up request: ${error.message}`);
      }
      
      this.logger.error(`Full error stack: ${error.stack}`);
      throw error;
    }
  }

  async sendVerificationEmail(params: EmailParams): Promise<void> {
    try {
      await this.sendTemplateEmail(params);
    } catch (error) {
      this.logger.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(params: EmailParams): Promise<void> {
    try {
      await this.sendTemplateEmail(params);
    } catch (error) {
      this.logger.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async sendApplicationStatusUpdate(params: EmailParams): Promise<void> {
    try {
      await this.sendTemplateEmail(params);
    } catch (error) {
      this.logger.error('Error sending application status update:', error);
      throw error;
    }
  }

  async sendInterviewScheduled(params: EmailParams): Promise<void> {
    try {
      await this.sendTemplateEmail(params);
    } catch (error) {
      this.logger.error('Error sending interview scheduled notification:', error);
      throw error;
    }
  }

  async sendDocumentVerificationStatus(params: EmailParams): Promise<void> {
    try {
      await this.sendTemplateEmail(params);
    } catch (error) {
      this.logger.error('Error sending document verification status:', error);
      throw error;
    }
  }

  async sendDeadlineReminder(email: string, name: string, deadline: Date, programName: string) {
    try {
      const params: EmailParams = {
        to: [{ email, name }],
        templateId: 6, // Update with your Brevo template ID
        params: {
          name: name,
          program_name: programName,
          deadline: deadline.toLocaleDateString(),
          days_remaining: Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        }
      };
      await this.sendTemplateEmail(params);
    } catch (error) {
      this.logger.error('Error sending deadline reminder:', error);
      throw error;
    }
  }

  // Method to test email configuration
  async testEmailConfiguration(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      this.logger.log('Testing email configuration...');
      
      const testParams: EmailParams = {
        to: [{ email: 'test@example.com', name: 'Test User' }],
        templateId: 1,
        params: {
          verificationLink: 'https://example.com/verify',
          userName: 'Test User'
        }
      };

      // Test the API connection without actually sending
      const response = await axios.get('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': this.apiKey,
          'Accept': 'application/json',
        },
      });

      this.logger.log('Brevo API connection test successful');
      this.logger.log(`Account info: ${JSON.stringify(response.data)}`);

      return {
        success: true,
        message: 'Email configuration is valid',
        details: {
          sender: this.fromEmail,
          apiKeyConfigured: !!this.apiKey,
          accountInfo: response.data
        }
      };
    } catch (error: any) {
      this.logger.error('Email configuration test failed');
      
      if (error.response) {
        this.logger.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        return {
          success: false,
          message: `API Error: ${error.response.status}`,
          details: error.response.data
        };
      } else {
        this.logger.error(`Connection Error: ${error.message}`);
        return {
          success: false,
          message: `Connection Error: ${error.message}`,
          details: error.message
        };
      }
    }
  }
}
