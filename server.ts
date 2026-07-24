import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API endpoint to send appointment notification email
  app.post("/api/send-appointment-email", async (req, res) => {
    try {
      const { appointment, targetEmail, customSmtp } = req.body;

      if (!appointment) {
        res.status(400).json({ error: "Dados do agendamento ausentes" });
        return;
      }

      const rawRecipient = targetEmail || process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || "contato@juliaguaraldovet.com.br";
      const recipientList = rawRecipient
        .split(/[,;\s]+/)
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0 && e.includes('@'));
      const recipient = recipientList.length > 0 ? recipientList.join(', ') : rawRecipient;

      const smtpHost = customSmtp?.host || process.env.SMTP_HOST;
      const smtpPort = parseInt(customSmtp?.port || process.env.SMTP_PORT || "587", 10);
      const smtpUser = customSmtp?.user || process.env.SMTP_USER;
      const smtpPass = customSmtp?.pass || process.env.SMTP_PASS;
      const smtpFrom = customSmtp?.from || process.env.SMTP_FROM || `"Dra. Júlia Vet - Agendamentos" <${smtpUser || recipient}>`;

      const formattedDate = appointment.date ? new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir';
      const cleanWhatsapp = (appointment.whatsapp || '').replace(/\D/g, '');
      const whatsappUrl = cleanWhatsapp ? `https://wa.me/${cleanWhatsapp}` : '#';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9f8; margin: 0; padding: 20px; color: #2d3748; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .header { background-color: #1b3a2b; color: #ffffff; padding: 28px; text-align: center; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 500; letter-spacing: 0.5px; }
            .header p { margin: 6px 0 0 0; font-size: 12px; color: #a3c4b2; }
            .content { padding: 28px; }
            .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1b3a2b; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #e8f0ec; padding-bottom: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .field { background: #f8faf9; padding: 12px 16px; border-radius: 8px; border: 1px solid #edf2f0; }
            .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #718096; margin-bottom: 4px; }
            .value { font-size: 14px; color: #1a202c; font-weight: 500; }
            .badge { display: inline-block; background-color: #e6f4ea; color: #137333; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .actions { margin-top: 28px; text-align: center; }
            .btn-wa { display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
            .footer { background: #edf2f0; padding: 16px; text-align: center; font-size: 11px; color: #718096; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐾 Nova Solicitação de Agendamento</h1>
              <p>Site Dra. Júlia Guaraldo — Medicina Veterinária Domiciliar & Anestesiologia</p>
            </div>
            <div class="content">
              <div style="text-align: right;">
                <span class="badge">Status: ${appointment.status || 'Pendente'}</span>
              </div>

              <div class="section-title">1. Dados do Tutor</div>
              <div class="field" style="margin-bottom: 8px;">
                <div class="label">Nome do Tutor</div>
                <div class="value">${appointment.name || '-'}</div>
              </div>
              <div class="grid">
                <div class="field">
                  <div class="label">E-mail</div>
                  <div class="value">${appointment.email || '-'}</div>
                </div>
                <div class="field">
                  <div class="label">Telefone / WhatsApp</div>
                  <div class="value">${appointment.whatsapp || appointment.phone || '-'}</div>
                </div>
              </div>

              <div class="section-title">2. Dados do Pet</div>
              <div class="grid">
                <div class="field">
                  <div class="label">Espécie & Raça</div>
                  <div class="value">${appointment.species || '-'} ${appointment.breed ? `(${appointment.breed})` : ''}</div>
                </div>
                <div class="field">
                  <div class="label">Idade / Peso</div>
                  <div class="value">${appointment.age || 'Não informado'} / ${appointment.weight ? `${appointment.weight} kg` : 'Não informado'}</div>
                </div>
              </div>

              <div class="section-title">3. Detalhes da Solicitação</div>
              <div class="grid" style="margin-bottom: 8px;">
                <div class="field">
                  <div class="label">Data Preferencial</div>
                  <div class="value">${formattedDate}</div>
                </div>
                <div class="field">
                  <div class="label">Horário Preferencial</div>
                  <div class="value">${appointment.time || 'A combinar'}</div>
                </div>
              </div>
              
              <div class="field" style="margin-bottom: 8px;">
                <div class="label">Motivo / Procedimento</div>
                <div class="value">${appointment.reason || '-'}</div>
              </div>

              ${appointment.address ? `
              <div class="field" style="margin-bottom: 8px;">
                <div class="label">Endereço de Atendimento</div>
                <div class="value">${appointment.address} ${appointment.cep ? `(CEP: ${appointment.cep})` : ''}</div>
              </div>` : ''}

              ${appointment.observations ? `
              <div class="field">
                <div class="label">Observações Clínicas</div>
                <div class="value">${appointment.observations}</div>
              </div>` : ''}

              <div class="actions">
                <a href="${whatsappUrl}" class="btn-wa" target="_blank">📱 Falar com o Tutor no WhatsApp</a>
              </div>
            </div>

            <div class="footer">
              E-mail enviado automaticamente pelo sistema de agendamento do site institucional.<br>
              Receptor: ${recipient}
            </div>
          </div>
        </body>
        </html>
      `;

      // Log the formatted email in server logs
      console.log(`[EMAIL DISPATCH] Preparando e-mail de agendamento para: ${recipient}`);

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const info = await transporter.sendMail({
          from: smtpFrom,
          to: recipient,
          subject: `🐾 Novo Agendamento: ${appointment.name} - Pet: ${appointment.species} ${appointment.breed ? `(${appointment.breed})` : ''}`,
          html: htmlContent,
          replyTo: appointment.email || undefined,
        });

        console.log(`[EMAIL DISPATCH] E-mail enviado via SMTP com Sucesso! Message ID: ${info.messageId}`);
        res.json({ success: true, messageId: info.messageId });
        return;
      }

      // If no SMTP server configured in env, return notification advice
      res.json({
        success: true,
        notice: "Solicitação registrada com sucesso no sistema. Para envio de e-mails em tempo real via servidor SMTP, configure as credenciais SMTP no Painel Administrativo ou no arquivo .env."
      });

    } catch (error: any) {
      console.error("[EMAIL DISPATCH ERROR]:", error);
      res.status(500).json({ error: error?.message || "Erro ao processar envio de e-mail" });
    }
  });

  // API endpoint to send a test email from the Admin Panel
  app.post("/api/test-email", async (req, res) => {
    try {
      const { targetEmail, customSmtp } = req.body;

      const rawRecipient = targetEmail || process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || "contato@juliaguaraldovet.com.br";
      const recipientList = rawRecipient
        .split(/[,;\s]+/)
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0 && e.includes('@'));
      const recipient = recipientList.length > 0 ? recipientList.join(', ') : rawRecipient;

      const smtpHost = customSmtp?.host || process.env.SMTP_HOST;
      const smtpPort = parseInt(customSmtp?.port || process.env.SMTP_PORT || "587", 10);
      const smtpUser = customSmtp?.user || process.env.SMTP_USER;
      const smtpPass = customSmtp?.pass || process.env.SMTP_PASS;
      const smtpFrom = customSmtp?.from || process.env.SMTP_FROM || `"Dra. Júlia Vet - Sistema" <${smtpUser || recipient}>`;

      if (!smtpHost || !smtpUser || !smtpPass) {
        res.status(400).json({
          error: "Credenciais SMTP incompletas. Preencha o Servidor SMTP (Host), Usuário e Senha no Painel para realizar os disparos."
        });
        return;
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

      // Verify SMTP credentials connection
      await transporter.verify();

      const testHtml = `
        <div style="font-family: sans-serif; padding: 24px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #1b3a2b; margin-top: 0;">✅ Teste de E-mail Bem-Sucedido!</h2>
          <p style="color: #4a5568; font-size: 14px;">Este é um e-mail de teste disparado pelo sistema do site <strong>Dra. Júlia Guaraldo Vet</strong>.</p>
          <div style="background: #f7faf8; padding: 12px; border-radius: 8px; border-left: 4px solid #1b3a2b; margin: 16px 0; font-size: 13px;">
            <strong>Destinatário(s):</strong> ${recipient}<br>
            <strong>Servidor SMTP:</strong> ${smtpHost}:${smtpPort}<br>
            <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}
          </div>
          <p style="color: #718096; font-size: 12px;">Se você recebeu esta mensagem, sua integração de notificações por e-mail está funcionando perfeitamente!</p>
        </div>
      `;

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: recipient,
        subject: `🧪 Teste de Notificação - Dra. Júlia Vet (${new Date().toLocaleTimeString('pt-BR')})`,
        html: testHtml,
      });

      res.json({
        success: true,
        message: `E-mail de teste enviado com sucesso para: ${recipient}! Check sua caixa de entrada / spam.`,
        messageId: info.messageId
      });

    } catch (error: any) {
      console.error("[TEST EMAIL ERROR]:", error);
      res.status(500).json({
        error: `Falha na conexão SMTP: ${error?.message || "Verifique se o servidor, usuário e senha de aplicativo estão corretos."}`
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
