import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  // Support CORS if called cross-origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { appointment, customSmtp } = body;

    if (!appointment || !appointment.email) {
      return res.status(400).json({ error: "O agendamento não possui e-mail cadastrado do tutor." });
    }

    const tutorEmail = appointment.email.trim();

    const smtpHost = customSmtp?.host || process.env.SMTP_HOST;
    const smtpPort = parseInt(customSmtp?.port || process.env.SMTP_PORT || "587", 10);
    const smtpUser = customSmtp?.user || process.env.SMTP_USER;
    const smtpPass = customSmtp?.pass || process.env.SMTP_PASS;
    const smtpFrom = customSmtp?.from || process.env.SMTP_FROM || `"Dra. Júlia Guaraldo Vet" <${smtpUser || "contato@juliaguaraldovet.com.br"}>`;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(200).json({
        success: true,
        notice: "O status foi atualizado, mas o e-mail não foi enviado pois as credenciais SMTP não estão configuradas."
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const isConfirmed = appointment.status === 'Confirmado';
    const formattedDate = appointment.date ? new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'A combinar';

    const subject = isConfirmed 
      ? `✅ Agendamento Confirmado! - Dra. Júlia Guaraldo Vet`
      : `ℹ️ Atualização de Agendamento - Dra. Júlia Guaraldo Vet`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9f8; margin: 0; padding: 20px; color: #2d3748; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .header { background-color: ${isConfirmed ? '#1b3a2b' : '#718096'}; color: #ffffff; padding: 28px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 500; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #e2e8f0; }
          .content { padding: 28px; }
          .greeting { font-size: 16px; font-weight: 600; color: #1b3a2b; margin-bottom: 12px; }
          .box { background: #f8faf9; border-left: 4px solid ${isConfirmed ? '#1b3a2b' : '#e53e3e'}; padding: 16px; border-radius: 8px; margin: 20px 0; }
          .field { font-size: 13px; margin-bottom: 6px; color: #4a5568; }
          .field strong { color: #1a202c; }
          .footer { background: #edf2f0; padding: 16px; text-align: center; font-size: 11px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isConfirmed ? '🎉 Seu Atendimento foi Confirmado!' : 'ℹ️ Atualização sobre seu Agendamento'}</h1>
            <p>Dra. Júlia Guaraldo — Medicina Veterinária Domiciliar & Anestesiologia</p>
          </div>
          <div class="content">
            <div class="greeting">Olá, ${appointment.name || 'Tutor(a)'}!</div>
            <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">
              ${isConfirmed 
                ? 'Temos o prazer de informar que a sua solicitação de atendimento médico veterinário foi <strong>confirmada</strong> com sucesso!'
                : 'Seu agendamento foi atualizado. Veja os detalhes abaixo ou entre em contato para remanejar o horário.'
              }
            </p>

            <div class="box">
              <div class="field"><strong>Pet:</strong> ${appointment.species || 'Pet'} ${appointment.breed ? `(${appointment.breed})` : ''}</div>
              <div class="field"><strong>Data:</strong> ${formattedDate}</div>
              <div class="field"><strong>Horário:</strong> ${appointment.time || 'A combinar'}</div>
              <div class="field"><strong>Procedimento/Serviço:</strong> ${appointment.reason || 'Consulta Veterinária'}</div>
              ${appointment.address ? `<div class="field"><strong>Endereço de Atendimento:</strong> ${appointment.address}</div>` : ''}
              <div class="field"><strong>Status Atual:</strong> <span style="color: ${isConfirmed ? '#2e7d32' : '#c62828'}; font-weight: bold;">${appointment.status}</span></div>
            </div>

            <p style="font-size: 13px; color: #718096; line-height: 1.5;">
              Caso precise tirar dúvidas ou precise reagendar, entre em contato diretamente pelo nosso WhatsApp ou e-mail.
            </p>
          </div>
          <div class="footer">
            Dra. Júlia Guaraldo — CRMV-SP<br>
            Atendimento Domiciliar & Anestesiologia Veterinária
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: tutorEmail,
      subject: subject,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Vercel Send Status Email Error:", error);
    return res.status(500).json({ error: error?.message || "Erro ao enviar e-mail de confirmação" });
  }
}
