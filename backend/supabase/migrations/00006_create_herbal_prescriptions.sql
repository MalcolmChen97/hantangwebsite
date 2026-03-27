CREATE TABLE herbal_prescriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_record_id  UUID NOT NULL REFERENCES visit_records(id) ON DELETE CASCADE,
  formula_name     TEXT,
  instructions     TEXT,
  duration_days    INTEGER,
  refills          INTEGER DEFAULT 0,
  notes            TEXT
);
CREATE INDEX idx_herbal_visit ON herbal_prescriptions (visit_record_id);

CREATE TABLE herb_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id       UUID NOT NULL REFERENCES herbal_prescriptions(id) ON DELETE CASCADE,
  herb_name_pinyin      TEXT NOT NULL,
  herb_name_chinese     TEXT,
  herb_name_latin       TEXT,
  dosage_grams          NUMERIC(6,1) NOT NULL,
  processing_method     TEXT,
  sort_order            INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_herbs_rx ON herb_items (prescription_id);
