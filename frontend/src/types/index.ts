export interface Patient {
  id: string
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  phone: string
  email?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  avatar_url?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  allergies?: string
  medical_history?: string
  notes?: string
  consent_signed: boolean
  last_visit_at?: string
  is_archived: boolean
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type ServiceType = 'acupuncture' | 'herbal_consultation' | 'initial_consultation' | 'follow_up' | 'other'
export type TreatmentType = 'acupuncture' | 'herbal' | 'acupuncture_and_herbal' | 'consultation' | 'other'
export type ConsentType = 'initial_consent' | 'acupuncture_consent' | 'post_treatment_confirmation'

export interface Appointment {
  id: string
  created_at: string
  updated_at: string
  patient_id: string
  start_time: string
  end_time: string
  service_type: ServiceType
  status: AppointmentStatus
  notes?: string
  sms_confirmation_sent: boolean
  sms_reminder_24h_sent: boolean
  sms_reminder_2h_sent: boolean
  patient?: Patient
}

export interface BlockedTime {
  id: string
  created_at: string
  start_time: string
  end_time: string
  reason?: string
  recurring: boolean
  recurrence_rule?: string
}

export interface VisitRecord {
  id: string
  created_at: string
  updated_at: string
  patient_id: string
  appointment_id?: string
  visit_datetime: string
  chief_complaint?: string
  treatment_type: TreatmentType
  doctor_notes?: string
  tongue_diagnosis?: string
  pulse_diagnosis?: string
  tcm_pattern?: string
  patient?: Patient
  acupuncture_details?: AcupunctureDetail[]
  herbal_prescriptions?: HerbalPrescription[]
}

export interface AcupunctureDetail {
  id: string
  visit_record_id: string
  acupoints: string[]
  needle_retention_min?: number
  needle_gauge?: string
  technique_notes?: string
  moxa_used: boolean
  electro_stim_used: boolean
  cupping_used: boolean
}

export interface HerbalPrescription {
  id: string
  visit_record_id: string
  formula_name?: string
  instructions?: string
  duration_days?: number
  refills?: number
  notes?: string
  herb_items?: HerbItem[]
}

export interface HerbItem {
  id: string
  prescription_id: string
  herb_name_pinyin: string
  herb_name_chinese?: string
  herb_name_latin?: string
  dosage_grams: number
  processing_method?: string
  sort_order: number
}

export interface ConsentRecord {
  id: string
  created_at: string
  patient_id: string
  visit_record_id?: string
  consent_type: ConsentType
  signature_url: string
  signed_at: string
  ip_address?: string
  witness_name?: string
}

export interface CommonAcupoint {
  id: string
  code: string
  name_pinyin: string
  name_chinese?: string
  name_english?: string
  meridian: string
  common_uses?: string
  is_favorite: boolean
  sort_order: number
}

export interface CommonFormula {
  id: string
  name_pinyin: string
  name_chinese?: string
  name_english?: string
  category?: string
  default_herbs: Array<{
    herb_name_pinyin: string
    herb_name_chinese?: string
    dosage_grams: number
    processing_method?: string
  }>
  instructions?: string
  is_favorite: boolean
  sort_order: number
}

export interface CommonTemplate {
  id: string
  category: 'chief_complaint' | 'doctor_notes' | 'treatment_plan' | 'instructions'
  title: string
  content: string
  sort_order: number
  is_active: boolean
}
