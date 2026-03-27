CREATE TABLE sms_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  phone_number    TEXT NOT NULL,
  message_type    TEXT NOT NULL,
  message_body    TEXT NOT NULL,
  twilio_sid      TEXT,
  status          TEXT NOT NULL DEFAULT 'sent'
);
