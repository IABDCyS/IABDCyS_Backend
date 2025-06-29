export const EMAIL_TEMPLATES = {
  VERIFICATION: {
    id: 1,
    name: 'Email Verification',
  },
  PASSWORD_RESET: {
    id: 2,
    name: 'Password Reset',
  },
  APPLICATION_STATUS: {
    id: 3,
    name: 'Application Status Update',
  },
  INTERVIEW_SCHEDULED: {
    id: 4,
    name: 'Interview Scheduled',
  },
  DOCUMENT_VERIFICATION: {
    id: 5,
    name: 'Document Verification Status',
  },
  DEADLINE_REMINDER: {
    id: 6,
    name: 'Application Deadline Reminder',
  },
} as const;

export const EMAIL_SUBJECTS = {
  VERIFICATION: 'Verify Your Email Address',
  PASSWORD_RESET: 'Reset Your Password',
  APPLICATION_STATUS: 'Application Status Update',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  DOCUMENT_VERIFICATION: 'Document Verification Status',
  DEADLINE_REMINDER: 'Application Deadline Reminder',
} as const;
