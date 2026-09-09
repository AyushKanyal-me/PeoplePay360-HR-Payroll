import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { BadRequestError } from './errors.js';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export class EmailService {
  private static getTransporter() {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      throw new BadRequestError(
        'Email delivery is currently not configured on this server. Please provide valid SMTP credentials in environment.'
      );
    }

    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  public static async sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
    const transporter = this.getTransporter();

    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
      attachments: options.attachments
    });

    return { messageId: info.messageId };
  }
}
