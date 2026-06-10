import nodemailer from "nodemailer";
import { env } from "../../../config/env.js";
import type { EmailProvider, SendMotionAlertInput } from "./EmailProvider.js";

export class NodemailerEmailProvider implements EmailProvider {
  async sendMotionAlert(input: SendMotionAlertInput): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn("[email] SMTP not configured. Motion alert was not sent.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS
      }
    });

    try {
      await transporter.sendMail({
        from: env.MAIL_FROM,
        to: env.ALERT_EMAIL_TO,
        subject: `Alerta de movimento - ${input.deviceId}`,
        text: [
          "Uma mudanca relevante foi detectada pela ESP32-CAM.",
          "",
          `Device ID: ${input.deviceId}`,
          `Capturada em: ${input.capturedAt}`,
          `Diff score: ${input.diffScore}`,
          `Imagem: ${input.imageUrl}`
        ].join("\n")
      });

      return true;
    } catch (error) {
      console.error("[email] failed to send motion alert", error);
      return false;
    }
  }

  private isConfigured(): boolean {
    return Boolean(env.MAIL_HOST && env.MAIL_USER && env.MAIL_PASS && env.MAIL_FROM);
  }
}
