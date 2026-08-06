import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import {
  passwordResetEmailTemplate,
  verificationEmailTemplate,
} from './templates/auth-email.templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>(
      'EMAIL_FROM',
      'Synergi <hello@synergi.dev>',
    );
    const apiKey = this.config.get<string>('RESEND_API_KEY');

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.transporter = null;
    } else {
      this.resend = null;
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST', 'localhost'),
        port: this.config.get<number>('SMTP_PORT', 1025),
        secure: false,
      });
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      if (this.resend) {
        await this.resend.emails.send({ from: this.from, to, subject, html });
      } else if (this.transporter) {
        await this.transporter.sendMail({ from: this.from, to, subject, html });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async sendVerificationEmail(
    to: string,
    firstName: string,
    verifyUrl: string,
  ): Promise<void> {
    const { subject, html } = verificationEmailTemplate(firstName, verifyUrl);
    await this.send(to, subject, html);
  }

  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    resetUrl: string,
  ): Promise<void> {
    const { subject, html } = passwordResetEmailTemplate(firstName, resetUrl);
    await this.send(to, subject, html);
  }
}
