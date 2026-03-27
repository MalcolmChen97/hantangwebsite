CREATE TYPE appointment_status AS ENUM (
  'scheduled','confirmed','arrived','in_progress','completed','cancelled','no_show'
);
CREATE TYPE service_type AS ENUM (
  'acupuncture','herbal_consultation','initial_consultation','follow_up','other'
);

CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  service_type    service_type NOT NULL,
  status          appointment_status NOT NULL DEFAULT 'scheduled',
  notes           TEXT,
  sms_confirmation_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sms_reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sms_reminder_2h_sent  BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_appointments_date   ON appointments (start_time);
CREATE INDEX idx_appointments_patient ON appointments (patient_id);
CREATE INDEX idx_appointments_status  ON appointments (status);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
