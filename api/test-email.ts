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
    const { targetEmail, customSmtp } = body;

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
      return res.status(400).json({
        error: "Credenciais SMTP incompletas. Preencha o Servidor SMTP (Host), Usuário e Senha de Aplicativo no Painel."
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

    return res.status(200).json({
      success: true,
      message: `E-mail de teste enviado com sucesso para: ${recipient}! Verifique sua caixa de entrada / spam.`,
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error("Vercel Test Email Error:", error);
    return res.status(500).json({
      error: `Falha na conexão SMTP: ${error?.message || "Verifique se o servidor, usuário e Senha de Aplicativo do Gmail estão corretos."}`
    });
  }
}
