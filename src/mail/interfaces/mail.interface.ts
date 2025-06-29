export interface EmailTemplate {
  templateId: number;
  params: Record<string, any>;
}

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailAttachment {
  name: string;
  content: string;
  type: string;
}

export interface EmailOptions {
  to: EmailRecipient[];
  templateId: number;
  params?: Record<string, any>;
  attachments?: EmailAttachment[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
}
