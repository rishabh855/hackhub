import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendInvitationEmail(to: string, projectName: string, link: string, inviterName: string) {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            this.logger.warn('SMTP credentials not provided. Skipping email delivery.');
            this.logger.log(`[Mock Email] To: ${to}, Project: ${projectName}, Link: ${link}`);
            return;
        }

        const mailOptions = {
            from: `"HackHub" <${process.env.SMTP_USER}>`,
            to,
            subject: `You've been invited to join ${projectName} on HackHub`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>You've been invited!</h2>
                    <p><strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong> on HackHub.</p>
                    <p>Click the button below to accept the invitation:</p>
                    <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
                    <p>Or copy and paste this link:</p>
                    <p>${link}</p>
                    <p>This invitation will expire in 7 days.</p>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Invitation email sent to ${to}`);
        } catch (error) {
            this.logger.error('Failed to send invitation email', error);
            // Don't throw logic error, just log it so API doesn't fail
        }
    }
}
