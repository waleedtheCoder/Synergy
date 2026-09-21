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

const button = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background-color:#ff7a00;color:#ffffff;text-decoration:none;border-radius:9999px;font-weight:600;font-size:14px;">${label}</a>
`;

export function verificationEmailTemplate(
  firstName: string,
  verifyUrl: string,
): { subject: string; html: string } {
  return {
    subject: 'Verify your Synergi account',
    html: shell(
      `Welcome, ${firstName} 👋`,
      `<p style="font-size:14px;line-height:1.6;color:#555;">Confirm your email address to finish setting up your Synergi account.</p>
       ${button(verifyUrl, 'Verify email')}
       <p style="font-size:12px;color:#999;margin-top:24px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>`,
    ),
  };
}

export function passwordResetEmailTemplate(
  firstName: string,
  resetUrl: string,
): { subject: string; html: string } {
  return {
    subject: 'Reset your Synergi password',
    html: shell(
      `Hi ${firstName},`,
      `<p style="font-size:14px;line-height:1.6;color:#555;">We received a request to reset your password. Click below to choose a new one.</p>
       ${button(resetUrl, 'Reset password')}
       <p style="font-size:12px;color:#999;margin-top:24px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
    ),
  };
}

export function newLoginAlertEmailTemplate(
  firstName: string,
  device: string,
  location: string,
): { subject: string; html: string } {
  return {
    subject: 'New sign-in to your Synergi account',
    html: shell(
      `Hi ${firstName},`,
      `<p style="font-size:14px;line-height:1.6;color:#555;">We noticed a sign-in to your account from a device or location we haven't seen before.</p>
       <p style="font-size:13px;line-height:1.6;color:#333;background:#f7f7f5;border-radius:8px;padding:12px 16px;margin-top:12px;">
         <strong>Device:</strong> ${device}<br/>
         <strong>Location/IP:</strong> ${location}
       </p>
       <p style="font-size:12px;color:#999;margin-top:24px;">If this was you, no action is needed. If you don't recognize this activity, reset your password immediately and review your active sessions.</p>`,
    ),
  };
}

export function passwordChangedEmailTemplate(firstName: string): {
  subject: string;
  html: string;
} {
  return {
    subject: 'Your Synergi password was changed',
    html: shell(
      `Hi ${firstName},`,
      `<p style="font-size:14px;line-height:1.6;color:#555;">Your Synergi account password was just changed, and all of your active sessions have been signed out for your security.</p>
       <p style="font-size:12px;color:#999;margin-top:24px;">If you made this change, no action is needed. If you didn't, please contact support immediately.</p>`,
    ),
  };
}
