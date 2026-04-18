import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export function generateOTP(): string {
  // Generates a proper secure 6-digit numeric OTP code
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendOTPEmail(email: string, otp: string, locale: string) {
  // Nodemailer config, using environment variables natively
  const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER || "smtp://localhost:1025");

  const isEs = locale === 'es' || locale === 'es-CL';
  const subject = isEs ? "Tu código de verificación - Loombox" : "Your verification code - Loombox";
  
  const textBody = isEs 
    ? `Tu código de verificación es: ${otp}\nEste código expirará en 10 minutos.`
    : `Your verification code is: ${otp}\nThis code will expire in 10 minutes.`;

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #4f46e5;">${isEs ? 'Verificación de Seguridad' : 'Security Verification'}</h2>
      <p>${isEs ? 'Ingresa el siguiente código de 6 dígitos para completar tu inicio de sesión:' : 'Enter the following 6-digit code to complete your login:'}</p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #6b7280;">
        ${isEs ? 'El código expirará en 10 minutos. Si no fuiste tú, puedes ignorar este correo.' : 'This code will expire in 10 minutes. If this wasn&#39;t you, you can ignore this email.'}
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "Loombox <noreply@loombox.internal>",
    to: email,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

export async function storeOTP(email: string, otp: string) {
  // Clear any existing tokens for this email first to prevent clutter
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const hashedToken = await bcrypt.hash(otp, 10);
  
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      attempts: 0,
      lockedUntil: null,
    },
  });
}

export async function verifyOTP(email: string, code: string): Promise<{ success: boolean; error?: string; attemptsLeft?: number; lockoutUntil?: Date }> {
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  });

  if (!tokenRecord) {
    return { success: false, error: 'invalid' };
  }

  // 1. Enforce lockout time decay
  if (tokenRecord.lockedUntil && tokenRecord.lockedUntil > new Date()) {
    return { success: false, error: 'locked', lockoutUntil: tokenRecord.lockedUntil };
  }

  // 2. Validate token expiry
  if (tokenRecord.expires < new Date()) {
    return { success: false, error: 'expired' };
  }

  // 3. Cryptographically check OTP
  const isValid = await bcrypt.compare(code, tokenRecord.token);

  if (isValid) {
    return { success: true };
  } else {
    // Max 5 attempts
    const newAttempts = tokenRecord.attempts + 1;
    let newLockedUntil = null;
    let errorCode = 'invalid';
    
    if (newAttempts >= 5) {
      newLockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 min lockout
      errorCode = 'locked';
    }

    await prisma.verificationToken.update({
      where: { identifier_token: { identifier: email, token: tokenRecord.token } },
      data: {
        attempts: newAttempts,
        lockedUntil: newLockedUntil,
      },
    });

    return { 
      success: false, 
      error: errorCode, 
      attemptsLeft: Math.max(0, 5 - newAttempts),
      lockoutUntil: newLockedUntil || undefined
    };
  }
}

export async function invalidateOTP(email: string) {
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });
}
