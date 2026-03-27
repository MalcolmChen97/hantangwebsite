CREATE TABLE acupuncture_details (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_record_id     UUID NOT NULL REFERENCES visit_records(id) ON DELETE CASCADE,
  acupoints           TEXT[] NOT NULL,
  needle_retention_min INTEGER,
  needle_gauge        TEXT,
  technique_notes     TEXT,
  moxa_used           BOOLEAN NOT NULL DEFAULT FALSE,
  electro_stim_used   BOOLEAN NOT NULL DEFAULT FALSE,
  cupping_used        BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_acu_visit ON acupuncture_details (visit_record_id);
