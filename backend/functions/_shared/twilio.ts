// Twilio SMS helper for Supabase Edge Functions
// NOTE: This code is ready but NOT activated. SMS sending is disabled until Twilio credentials are configured.

interface SendSmsParams {
  to: string
  body: string
}

interface TwilioResponse {
  sid: string
  status: string
}

export async function sendSms({ to, body }: SendSmsParams): Promise<TwilioResponse> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.')
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const credentials = btoa(`${accountSid}:${authToken}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: body,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Twilio API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return { sid: data.sid, status: data.status }
}
