CREATE TYPE template_category AS ENUM (
  'chief_complaint','doctor_notes','treatment_plan','instructions'
);

CREATE TABLE common_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    template_category NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE common_acupoints (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  name_pinyin    TEXT NOT NULL,
  name_chinese   TEXT,
  name_english   TEXT,
  meridian       TEXT NOT NULL,
  common_uses    TEXT,
  is_favorite    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_acupoints_meridian ON common_acupoints (meridian);

CREATE TABLE common_formulas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_pinyin     TEXT NOT NULL,
  name_chinese    TEXT,
  name_english    TEXT,
  category        TEXT,
  default_herbs   JSONB NOT NULL DEFAULT '[]',
  instructions    TEXT,
  is_favorite     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0
);
