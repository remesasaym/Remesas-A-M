const { Resend } = require('resend');
const logger = require('pino')();

// Inicializar Resend con la API Key del entorno
// Si no hay key, el servicio funcionará en modo "dry run" (solo logs)
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev'; // Email por defecto de pruebas de Resend

/**
 * Envía un correo electrónico genérico
 */
async function sendEmail({ to, subject, html }) {
    if (!resend) {
        logger.warn({ to, subject }, "⚠️ RESEND_API_KEY no configurada. Simulación de envío de correo.");
        return { success: true, simulated: true };
    }

    try {
        const data = await resend.emails.send({
            from: 'Remesas A&M <' + SENDER_EMAIL + '>',
            to,
            subject,
            html,
        });

        logger.info({ to, subject, id: data.id }, "📧 Correo enviado exitosamente");
        return { success: true, data };
    } catch (error) {
        logger.error({ error, to, subject }, "❌ Error enviando correo");
        return { success: false, error };
    }
}

/**
 * Notifica el resultado de la verificación KYC
 */
async function sendKycStatusEmail(user, status, reason = null) {
    const isApproved = status === 'approved';
    const subject = isApproved
        ? '🎉 ¡Tu identidad ha sido verificada!'
        : '⚠️ Actualización sobre tu verificación de identidad';

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: ${isApproved ? '#16a34a' : '#dc2626'};">
        ${isApproved ? '¡Verificación Exitosa!' : 'Verificación Rechazada'}
      </h1>
      <p>Hola ${user.full_name || 'Usuario'},</p>
      
      ${isApproved
            ? `<p>Nos complace informarte que tu identidad ha sido verificada correctamente. <strong>Ya puedes realizar envíos de dinero sin restricciones.</strong></p>
           <a href="https://remesas-am.com/dashboard" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Ir a mi Dashboard</a>`
            : `<p>Lamentablemente, no pudimos verificar tu identidad en este momento.</p>
           ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
           <p>Por favor, intenta subir tus documentos nuevamente asegurándote de que sean legibles y vigentes.</p>`
        }
      
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 12px;">Remesas A&M - Tu dinero, seguro y rápido.</p>
    </div>
  `;

    return sendEmail({ to: user.email, subject, html });
}

/**
 * Notifica actualizaciones de remesas
 */
async function sendRemittanceUpdateEmail(user, transaction) {
    let title, message, color;

    switch (transaction.status) {
        case 'PENDIENTE':
            title = '⏳ Remesa Recibida';
            message = `Hemos recibido tu solicitud de envío por <strong>${transaction.amount_sent} ${transaction.currency_sent}</strong>. Estamos verificando tu pago.`;
            color = '#ca8a04'; // Yellow
            break;
        case 'PROCESANDO':
            title = '⚙️ Remesa en Proceso';
            message = `Tu pago ha sido confirmado y el dinero está en camino a ${transaction.to_country_code}.`;
            color = '#2563eb'; // Blue
            break;
        case 'COMPLETADO':
            title = '✅ Remesa Completada';
            message = `¡Listo! El dinero ha sido entregado a tu beneficiario.`;
            color = '#16a34a'; // Green
            break;
        case 'FALLIDO':
            title = '❌ Remesa Fallida';
            message = `Hubo un problema con tu envío. Por favor contacta a soporte.`;
            color = '#dc2626'; // Red
            break;
        default:
            return; // No enviar correos para otros estados
    }

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: ${color};">${title}</h1>
      <p>Hola ${user.full_name || 'Usuario'},</p>
      <p>${message}</p>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>ID Transacción:</strong> ${transaction.transaction_id}</p>
        <p style="margin: 5px 0;"><strong>Monto Enviado:</strong> ${transaction.amount_sent} ${transaction.currency_sent}</p>
        <p style="margin: 5px 0;"><strong>Beneficiario:</strong> ${transaction.recipient_name || 'Beneficiario'}</p>
      </div>

      <p>Gracias por confiar en nosotros.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 12px;">Remesas A&M</p>
    </div>
  `;

    return sendEmail({ to: user.email, subject: `Actualización de Remesa: ${transaction.transaction_id}`, html });
}

module.exports = {
    sendKycStatusEmail,
    sendRemittanceUpdateEmail
};
