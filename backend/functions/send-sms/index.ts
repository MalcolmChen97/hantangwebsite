// Supabase Edge Function: send-sms
// NOTE: This function is deployed but SMS sending requires Twilio credentials to be configured.
// Set secrets via: supabase secrets set TWILIO_ACCOUNT_SID=xxx TWILIO_AUTH_TOKEN=xxx TWILIO_PHONE_NUMBER=xxx

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendSms } from '../_shared/twilio.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SmsRequest {
  to: string
  body: string
  appointment_id?: string
  patient_id: string
  message_type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'reschedule' | 'cancel'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { to, body, appointment_id, patient_id, message_type } = await req.json() as SmsRequest

    if (!to || !body || !patient_id || !message_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, body, patient_id, message_type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send SMS via Twilio
    const result = await sendSms({ to, body })

    // Log the SMS
    await supabase.from('sms_log').insert({
      appointment_id,
      patient_id,
      phone_number: to,
      message_type,
      message_body: body,
      twilio_sid: result.sid,
      status: result.status,
    })

    // Update appointment SMS flags if applicable
    if (appointment_id) {
      const flagMap: Record<string, string> = {
        confirmation: 'sms_confirmation_sent',
        reminder_24h: 'sms_reminder_24h_sent',
        reminder_2h: 'sms_reminder_2h_sent',
      }
      const flag = flagMap[message_type]
      if (flag) {
        await supabase.from('appointments').update({ [flag]: true }).eq('id', appointment_id)
      }
    }

    return new Response(JSON.stringify({ success: true, sid: result.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
