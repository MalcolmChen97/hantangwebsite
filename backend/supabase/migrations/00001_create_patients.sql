CREATE TABLE patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  date_of_birth DATE,
  gender        TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  avatar_url    TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  allergies     TEXT,
  medical_history TEXT,
  notes         TEXT,
  consent_signed BOOLEAN NOT NULL DEFAULT FALSE,
  last_visit_at TIMESTAMPTZ,
  is_archived   BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_patients_phone ON patients (phone);
CREATE INDEX idx_patients_name  ON patients (last_name, first_name);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
