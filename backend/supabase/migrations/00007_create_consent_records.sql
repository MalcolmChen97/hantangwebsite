CREATE TYPE consent_type AS ENUM (
  'initial_consent','acupuncture_consent','post_treatment_confirmation'
);

CREATE TABLE consent_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_record_id UUID REFERENCES visit_records(id) ON DELETE SET NULL,
  consent_type    consent_type NOT NULL,
  signature_url   TEXT NOT NULL,
  signed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address      TEXT,
  witness_name    TEXT
);
CREATE INDEX idx_consent_patient ON consent_records (patient_id);
