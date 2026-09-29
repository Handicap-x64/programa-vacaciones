import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../config.js";

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

async function enviarCorreo(destino, codigo) {
    try {
        await transporter.verify();
        console.log("Server is ready to take our messages");
    } catch (err) {
        console.error("Verification failed:", err);
    }


  const info = await transporter.sendMail({
    from: `"ORICHUNA C.A" <${process.env.EMAIL_USER}>`,
    to: destino,
    subject: 'Tu código de verificación de ORICHUNA.CA',
    text: `Tu código es ${codigo}. Expira en 10 minutos.`, // versión texto plano
    html: `
      <h2>Código de verificación</h2>
      <p>Tu código es:</p>
      <h1 style="letter-spacing: 4px;">${codigo}</h1>
      <p>Expira en 10 minutos.</p>
    `
  });

  console.log('Enviado:', info.messageId);
}

export { enviarCorreo }