-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE acupuncture_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE herbal_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE herb_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_acupoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

-- Authenticated access policies for all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'patients','appointments','blocked_times','visit_records',
      'acupuncture_details','herbal_prescriptions','herb_items',
      'consent_records','common_templates','common_acupoints',
      'common_formulas','sms_log'
    ])
  LOOP
    EXECUTE format('CREATE POLICY "auth_select_%s" ON %I FOR SELECT USING (auth.role() = ''authenticated'')', tbl, tbl);
    EXECUTE format('CREATE POLICY "auth_insert_%s" ON %I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', tbl, tbl);
    EXECUTE format('CREATE POLICY "auth_update_%s" ON %I FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')', tbl, tbl);
    EXECUTE format('CREATE POLICY "auth_delete_%s" ON %I FOR DELETE USING (auth.role() = ''authenticated'')', tbl, tbl);
  END LOOP;
END $$;
