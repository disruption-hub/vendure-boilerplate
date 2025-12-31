import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(params: {
    to: string;
    subject: string;
    text: string;
    apiKey: string;
    senderEmail: string;
    senderName: string;
  }) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': params.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: params.senderName, email: params.senderEmail },
          to: [{ email: params.to }],
          subject: params.subject,
          textContent: params.text,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as Record<string, any>;
        this.logger.error(`Brevo API error: ${JSON.stringify(error)}`);
        throw new Error(
          `Failed to send email via Brevo: ${response.statusText}`,
        );
      }

      this.logger.log(`Email sent successfully to ${params.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending email: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async sendSms(params: {
    to: string;
    text: string;
    apiKey: string;
    user: string;
    senderId?: string;
    url?: string;
  }) {
    try {
      const url = params.url || 'https://api.labsmobile.com/json/send';
      const auth = Buffer.from(`${params.user}:${params.apiKey}`).toString(
        'base64',
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          Cache: 'no-cache',
        },
        body: JSON.stringify({
          message: params.text,
          tpoa: params.senderId || 'ZKey',
          recipient: [
            {
              msisdn: params.to.replace(/\+/g, ''), // LabsMobile usually expects numbers without +
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as Record<string, any>;
        this.logger.error(`LabsMobile API error: ${JSON.stringify(error)}`);
        throw new Error(
          `Failed to send SMS via LabsMobile: ${response.statusText}`,
        );
      }

      this.logger.log(`SMS sent successfully to ${params.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending SMS: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
