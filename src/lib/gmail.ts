export interface GmailMessage {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

/**
 * Send an email (e.g., student progress report or schedule reminder) via Gmail API
 */
export async function sendGmailEmail(
  accessToken: string,
  toEmail: string,
  subject: string,
  bodyText: string
): Promise<boolean> {
  try {
    const emailLines = [
      `To: ${toEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      bodyText,
    ];

    const email = emailLines.join('\r\n');
    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64EncodedEmail }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Failed to send email via Gmail API:', err);
      throw new Error(`Gmail API error (${response.status})`);
    }

    return true;
  } catch (err) {
    console.error('Error sending email with Gmail API:', err);
    throw err;
  }
}
