const shell = (title: string, bodyHtml: string) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Inter',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:32px 40px 0;">
                <span style="font-size:20px;font-weight:700;color:#111111;">Synergi</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px;color:#111111;">
                <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export function paymentConfirmedEmailTemplate(
  firstName: string,
  description: string,
  amount: string,
): { subject: string; html: string } {
  return {
    subject: 'Payment confirmed',
    html: shell(
      `Thanks, ${firstName}!`,
      `<p style="font-size:14px;line-height:1.6;color:#555;">We've confirmed your payment of <strong>$${amount}</strong> for ${description}.</p>
       <p style="font-size:14px;line-height:1.6;color:#555;">It's now active on your account.</p>`,
    ),
  };
}

export function paymentRejectedEmailTemplate(
  firstName: string,
  description: string,
  amount: string,
): { subject: string; html: string } {
  return {
    subject: 'Payment claim rejected',
    html: shell(
      `Hi ${firstName},`,
      `<p style="font-size:14px;line-height:1.6;color:#555;">We couldn't confirm your payment claim of <strong>$${amount}</strong> for ${description}.</p>
       <p style="font-size:14px;line-height:1.6;color:#555;">If you believe this is a mistake, please submit a new payment claim or contact support with your reference.</p>`,
    ),
  };
}

export function paymentRefundedEmailTemplate(
  firstName: string,
  description: string,
  amount: string,
): { subject: string; html: string } {
  return {
    subject: 'Payment refunded',
    html: shell(
      `Hi ${firstName},`,
      `<p style="font-size:14px;line-height:1.6;color:#555;">Your payment of <strong>$${amount}</strong> for ${description} has been refunded.</p>`,
    ),
  };
}
