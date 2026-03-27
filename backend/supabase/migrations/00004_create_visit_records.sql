CREATE TYPE treatment_type AS ENUM (
  'acupuncture','herbal','acupuncture_and_herbal','consultation','other'
);

CREATE TABLE visit_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id   UUID REFERENCES appointments(id) ON DELETE SET NULL,
  visit_datetime   TIMESTAMPTZ NOT NULL DEFAULT now(),
  chief_complaint  TEXT,
  treatment_type   treatment_type NOT NULL,
  doctor_notes     TEXT,
  tongue_diagnosis TEXT,
  pulse_diagnosis  TEXT,
  tcm_pattern      TEXT
);
CREATE INDEX idx_visits_patient ON visit_records (patient_id);
CREATE INDEX idx_visits_date    ON visit_records (visit_datetime);

CREATE TRIGGER visit_records_updated_at
  BEFORE UPDATE ON visit_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
