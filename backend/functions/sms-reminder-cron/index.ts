// Supabase Edge Function: sms-reminder-cron
// Runs on a schedule (every 15 minutes via pg_cron) to send appointment reminders.
// NOTE: Requires Twilio credentials. Not activated until credentials are configured.
//
// Setup pg_cron:
// SELECT cron.schedule('sms-reminders', '*/15 * * * *', $$
//   SELECT net.http_post(
//     url := '<SUPABASE_URL>/functions/v1/sms-reminder-cron',
//     headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>'),
//     body := '{}'::jsonb
//   );
// $$);

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendSms } from '../_shared/twilio.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const results = { reminder_24h: 0, reminder_2h: 0, errors: 0 }

    // 24-hour reminders: appointments starting in 23-25 hours
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString()
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()

    const { data: appointments24h } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .in('status', ['scheduled', 'confirmed'])
      .eq('sms_reminder_24h_sent', false)
      .gte('start_time', in23h)
      .lte('start_time', in25h)

    for (const appt of appointments24h || []) {
      try {
        const patient = appt.patient
        if (!patient?.phone) continue

        const time = new Date(appt.start_time).toLocaleString('zh-CN', {
          month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })

        await sendSms({
          to: patient.phone,
          body: `${patient.last_name}${patient.first_name}您好，温馨提醒：您明天 ${time} 在本诊所有预约，请准时到达。如需改期请提前联系我们。`,
        })

        await supabase.from('sms_log').insert({
          appointment_id: appt.id,
          patient_id: patient.id,
          phone_number: patient.phone,
          message_type: 'reminder_24h',
          message_body: `24h reminder sent for ${time}`,
          status: 'sent',
        })

        await supabase.from('appointments').update({ sms_reminder_24h_sent: true }).eq('id', appt.id)
        results.reminder_24h++
      } catch {
        results.errors++
      }
    }

    // 2-hour reminders: appointments starting in 1.75-2.25 hours
    const in105m = new Date(now.getTime() + 105 * 60 * 1000).toISOString()
    const in135m = new Date(now.getTime() + 135 * 60 * 1000).toISOString()

    const { data: appointments2h } = await supabase
      .from('appointments')
      .select('*, patient:patients(*)')
      .in('status', ['scheduled', 'confirmed'])
      .eq('sms_reminder_2h_sent', false)
      .gte('start_time', in105m)
      .lte('start_time', in135m)

    for (const appt of appointments2h || []) {
      try {
        const patient = appt.patient
        if (!patient?.phone) continue

        const time = new Date(appt.start_time).toLocaleTimeString('zh-CN', {
          hour: '2-digit', minute: '2-digit'
        })

        await sendSms({
          to: patient.phone,
          body: `${patient.last_name}${patient.first_name}您好，您今天 ${time} 的预约即将开始，请准时到达。`,
        })

        await supabase.from('sms_log').insert({
          appointment_id: appt.id,
          patient_id: patient.id,
          phone_number: patient.phone,
          message_type: 'reminder_2h',
          message_body: `2h reminder sent for ${time}`,
          status: 'sent',
        })

        await supabase.from('appointments').update({ sms_reminder_2h_sent: true }).eq('id', appt.id)
        results.reminder_2h++
      } catch {
        results.errors++
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
