import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { auth } from '@/auth';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json({ message: 'Si el correo existe, recibirás un enlace para recuperar tu contraseña.' }, { status: 200 });
        }

        const resetToken = crypto.randomUUID();
        const resetTokenExpiry = new Date(Date.now() + 3600000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: `RESET_${resetToken}`,
            },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || 'https://ecunomina.vercel.app'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Ecunomina" <noreply@ecunomina.com>',
            to: email,
            subject: 'Recuperación de contraseña - Ecunomina',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #1e40af;">Recuperación de contraseña</h1>
                    <p>Hola ${user.name || 'usuario'},</p>
                    <p>Has solicitado recuperar tu contraseña en Ecunomina.</p>
                    <p>Haz clic en el siguiente botón para establecer una nueva contraseña:</p>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Recuperar contraseña</a>
                    <p>Este enlace expirará en 1 hora.</p>
                    <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">© 2026 Ecunomina</p>
                </div>
            `,
        });

        return NextResponse.json({ message: 'Si el correo existe, recibirás un enlace para recuperar tu contraseña.' }, { status: 200 });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
    }
}
