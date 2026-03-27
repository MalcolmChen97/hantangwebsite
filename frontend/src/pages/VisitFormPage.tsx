import { useState, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  X,
  Search,
  Star,
  Zap,
  Flame,
  CircleDot,
  PenTool,
  RotateCcw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { isDemoMode, DEMO_PATIENTS, DEMO_ACUPOINTS, DEMO_FORMULAS, DEMO_TEMPLATES } from '@/lib/demo-data'
import type {
  Patient,
  TreatmentType,
  CommonAcupoint,
  CommonFormula,
  CommonTemplate,
} from '@/types'
import { TREATMENT_TYPE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface HerbRow {
  herb_name_pinyin: string
  herb_name_chinese: string
  dosage_grams: number
  processing_method: string
}

export default function VisitFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const patientId = searchParams.get('patient_id')!
  const appointmentId = searchParams.get('appointment_id')

  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('acupuncture')
  const [tongueDiagnosis, setTongueDiagnosis] = useState('')
  const [pulseDiagnosis, setPulseDiagnosis] = useState('')
  const [tcmPattern, setTcmPattern] = useState('')
  const [doctorNotes, setDoctorNotes] = useState('')

  // Acupuncture state
  const [selectedAcupoints, setSelectedAcupoints] = useState<string[]>([])
  const [acupointSearch, setAcupointSearch] = useState('')
  const [needleRetentionMin, setNeedleRetentionMin] = useState(30)
  const [moxaUsed, setMoxaUsed] = useState(false)
  const [electroStimUsed, setElectroStimUsed] = useState(false)
  const [cuppingUsed, setCuppingUsed] = useState(false)
  const [techniqueNotes, setTechniqueNotes] = useState('')

  // Herbal state
  const [formulaName, setFormulaName] = useState('')
  const [herbs, setHerbs] = useState<HerbRow[]>([])
  const [herbalInstructions, setHerbalInstructions] = useState('')
  const [durationDays, setDurationDays] = useState(7)

  const showAcupuncture = ['acupuncture', 'acupuncture_and_herbal'].includes(treatmentType)
  const showHerbal = ['herbal', 'acupuncture_and_herbal'].includes(treatmentType)

  // Queries
  // Signature
  const sigCanvasRef = useRef<SignatureCanvas>(null)
  const [signatureData, setSignatureData] = useState<string | null>(null)

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (isDemoMode) return DEMO_PATIENTS.find(p => p.id === patientId) ?? null
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()
      if (error) throw error
      return data as Patient
    },
    enabled: !!patientId,
  })

  const { data: acupoints = [] } = useQuery({
    queryKey: ['common-acupoints'],
    queryFn: async () => {
      if (isDemoMode) return DEMO_ACUPOINTS
      const { data, error } = await supabase.from('common_acupoints').select('*').order('sort_order')
      if (error) throw error
      return data as CommonAcupoint[]
    },
  })

  const { data: formulas = [] } = useQuery({
    queryKey: ['common-formulas'],
    queryFn: async () => {
      if (isDemoMode) return DEMO_FORMULAS
      const { data, error } = await supabase.from('common_formulas').select('*').order('sort_order')
      if (error) throw error
      return data as CommonFormula[]
    },
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['common-templates'],
    queryFn: async () => {
      if (isDemoMode) return DEMO_TEMPLATES
      const { data, error } = await supabase.from('common_templates').select('*').eq('is_active', true).order('sort_order')
      if (error) throw error
      return data as CommonTemplate[]
    },
  })

  const chiefComplaintTemplates = templates.filter((t) => t.category === 'chief_complaint')
  const doctorNotesTemplates = templates.filter((t) => t.category === 'doctor_notes')

  // Group acupoints by meridian, favorites first
  const groupedAcupoints = useMemo(() => {
    const filtered = acupointSearch
      ? acupoints.filter(
          (a) =>
            a.name_pinyin.toLowerCase().includes(acupointSearch.toLowerCase()) ||
            (a.name_chinese && a.name_chinese.includes(acupointSearch)) ||
            a.code.toLowerCase().includes(acupointSearch.toLowerCase())
        )
      : acupoints

    const favorites = filtered.filter((a) => a.is_favorite)
    const byMeridian: Record<string, CommonAcupoint[]> = {}
    for (const a of filtered) {
      if (!byMeridian[a.meridian]) byMeridian[a.meridian] = []
      byMeridian[a.meridian].push(a)
    }

    return { favorites, byMeridian }
  }, [acupoints, acupointSearch])

  const toggleAcupoint = (code: string) => {
    setSelectedAcupoints((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const selectFormula = (formulaId: string) => {
    const formula = formulas.find((f) => f.id === formulaId)
    if (!formula) return
    setFormulaName(formula.name_chinese ?? formula.name_pinyin)
    setHerbs(
      formula.default_herbs.map((h) => ({
        herb_name_pinyin: h.herb_name_pinyin,
        herb_name_chinese: h.herb_name_chinese ?? '',
        dosage_grams: h.dosage_grams,
        processing_method: h.processing_method ?? '',
      }))
    )
    if (formula.instructions) setHerbalInstructions(formula.instructions)
  }

  const addHerbRow = () => {
    setHerbs((prev) => [
      ...prev,
      { herb_name_pinyin: '', herb_name_chinese: '', dosage_grams: 10, processing_method: '' },
    ])
  }

  const updateHerb = (index: number, field: keyof HerbRow, value: string | number) => {
    setHerbs((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  const removeHerb = (index: number) => {
    setHerbs((prev) => prev.filter((_, i) => i !== index))
  }

  // Save mutation
  const saveVisit = useMutation({
    mutationFn: async () => {
      // 1. Create visit record
      const { data: visitRecord, error: visitError } = await supabase
        .from('visit_records')
        .insert({
          patient_id: patientId,
          appointment_id: appointmentId || null,
          visit_datetime: new Date().toISOString(),
          chief_complaint: chiefComplaint || null,
          treatment_type: treatmentType,
          tongue_diagnosis: tongueDiagnosis || null,
          pulse_diagnosis: pulseDiagnosis || null,
          tcm_pattern: tcmPattern || null,
          doctor_notes: doctorNotes || null,
        })
        .select()
        .single()

      if (visitError) throw visitError

      // 2. Create acupuncture details
      if (showAcupuncture && selectedAcupoints.length > 0) {
        const { error } = await supabase.from('acupuncture_details').insert({
          visit_record_id: visitRecord.id,
          acupoints: selectedAcupoints,
          needle_retention_min: needleRetentionMin,
          moxa_used: moxaUsed,
          electro_stim_used: electroStimUsed,
          cupping_used: cuppingUsed,
          technique_notes: techniqueNotes || null,
        })
        if (error) throw error
      }

      // 3. Create herbal prescription + herb items
      if (showHerbal && herbs.length > 0) {
        const { data: prescription, error: rxError } = await supabase
          .from('herbal_prescriptions')
          .insert({
            visit_record_id: visitRecord.id,
            formula_name: formulaName || null,
            instructions: herbalInstructions || null,
            duration_days: durationDays,
          })
          .select()
          .single()

        if (rxError) throw rxError

        if (herbs.length > 0) {
          const herbItems = herbs.map((h, i) => ({
            prescription_id: prescription.id,
            herb_name_pinyin: h.herb_name_pinyin,
            herb_name_chinese: h.herb_name_chinese || null,
            dosage_grams: h.dosage_grams,
            processing_method: h.processing_method || null,
            sort_order: i,
          }))
          const { error: herbError } = await supabase.from('herb_items').insert(herbItems)
          if (herbError) throw herbError
        }
      }

      // 4. Update appointment status if applicable
      if (appointmentId) {
        await supabase
          .from('appointments')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', appointmentId)
      }

      // 5. Update patient last_visit_at
      await supabase
        .from('patients')
        .update({ last_visit_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', patientId)

      return visitRecord
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
      toast({ title: '就诊记录已保存' })
      navigate(-1)
    },
    onError: (error) => {
      toast({ title: `保存失败: ${error.message}`, variant: 'destructive' })
    },
  })

  if (patientLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const fullName = patient ? `${patient.last_name}${patient.first_name}` : ''
  const initials = patient
    ? `${patient.last_name?.[0] ?? ''}${patient.first_name?.[0] ?? ''}`
    : '?'

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        <h1 className="text-lg font-bold">新建就诊记录</h1>
        <div className="w-16" />
      </div>

      {/* Patient info */}
      {patient && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {patient.avatar_url && <AvatarImage src={patient.avatar_url} />}
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{fullName}</p>
              <p className="text-sm text-muted-foreground">{patient.phone}</p>
            </div>
            {patient.allergies && (
              <Badge variant="destructive" className="ml-auto text-xs">
                过敏: {patient.allergies}
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {/* Chief Complaint */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">主诉</Label>
          {chiefComplaintTemplates.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chiefComplaintTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="px-2.5 py-1 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                  onClick={() =>
                    setChiefComplaint((prev) => (prev ? `${prev}，${t.content}` : t.content))
                  }
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
          <Textarea
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="描述患者主要症状..."
            rows={3}
          />
        </div>

        {/* Treatment Type */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">治疗类型</Label>
          <Select
            value={treatmentType}
            onValueChange={(v) => setTreatmentType(v as TreatmentType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TREATMENT_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* TCM Diagnostics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">舌诊</Label>
            <Input
              value={tongueDiagnosis}
              onChange={(e) => setTongueDiagnosis(e.target.value)}
              placeholder="舌质、舌苔描述"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">脉诊</Label>
            <Input
              value={pulseDiagnosis}
              onChange={(e) => setPulseDiagnosis(e.target.value)}
              placeholder="脉象描述"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">辨证</Label>
          <Input
            value={tcmPattern}
            onChange={(e) => setTcmPattern(e.target.value)}
            placeholder="中医证型"
          />
        </div>

        {/* Acupuncture Section */}
        {showAcupuncture && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-primary" />
                  针灸治疗
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Acupoint Search & Selection */}
                <div className="space-y-2">
                  <Label>穴位选择</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索穴位 (拼音/中文/代码)..."
                      value={acupointSearch}
                      onChange={(e) => setAcupointSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Selected acupoints */}
                  {selectedAcupoints.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-primary/5 border border-primary/10">
                      {selectedAcupoints.map((code) => {
                        const ap = acupoints.find((a) => a.code === code)
                        return (
                          <Badge
                            key={code}
                            variant="secondary"
                            className="cursor-pointer hover:bg-destructive/20"
                            onClick={() => toggleAcupoint(code)}
                          >
                            {ap?.name_chinese ?? code}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )
                      })}
                    </div>
                  )}

                  {/* Favorites */}
                  {groupedAcupoints.favorites.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        常用穴位
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {groupedAcupoints.favorites.map((a) => (
                          <button
                            key={a.code}
                            type="button"
                            className={cn(
                              'px-2.5 py-1 text-xs rounded-full border transition-colors',
                              selectedAcupoints.includes(a.code)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted border-border'
                            )}
                            onClick={() => toggleAcupoint(a.code)}
                          >
                            {a.name_chinese ?? a.name_pinyin}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* By meridian */}
                  {Object.entries(groupedAcupoints.byMeridian).map(([meridian, points]) => (
                    <div key={meridian}>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        {meridian}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {points.map((a) => (
                          <button
                            key={a.code}
                            type="button"
                            className={cn(
                              'px-2.5 py-1 text-xs rounded-full border transition-colors',
                              selectedAcupoints.includes(a.code)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted border-border'
                            )}
                            onClick={() => toggleAcupoint(a.code)}
                          >
                            {a.name_chinese ?? a.name_pinyin}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Needle retention */}
                <div className="space-y-2">
                  <Label>留针时间 (分钟)</Label>
                  <Input
                    type="number"
                    value={needleRetentionMin}
                    onChange={(e) => setNeedleRetentionMin(parseInt(e.target.value) || 0)}
                    min={0}
                    max={120}
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moxaUsed}
                      onChange={(e) => setMoxaUsed(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">艾灸</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={electroStimUsed}
                      onChange={(e) => setElectroStimUsed(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">电针</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cuppingUsed}
                      onChange={(e) => setCuppingUsed(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <CircleDot className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">拔罐</span>
                  </label>
                </div>

                {/* Technique notes */}
                <div className="space-y-2">
                  <Label>手法备注</Label>
                  <Textarea
                    value={techniqueNotes}
                    onChange={(e) => setTechniqueNotes(e.target.value)}
                    placeholder="记录针刺手法等..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Herbal Section */}
        {showHerbal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-600" />
                  中药处方
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Formula selector */}
                <div className="space-y-2">
                  <Label>选择方剂模板</Label>
                  <Select onValueChange={selectFormula}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择方剂自动填入药材..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formulas.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name_chinese ?? f.name_pinyin}
                          {f.category && ` (${f.category})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Formula name */}
                <div className="space-y-2">
                  <Label>方剂名称</Label>
                  <Input
                    value={formulaName}
                    onChange={(e) => setFormulaName(e.target.value)}
                    placeholder="输入方剂名称"
                  />
                </div>

                {/* Herb list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>药材列表</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addHerbRow}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      添加药材
                    </Button>
                  </div>

                  {herbs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      暂无药材，点击上方按钮添加或选择方剂模板
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {herbs.map((herb, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-[1fr_1fr_80px_1fr_32px] gap-2 items-center"
                        >
                          <Input
                            placeholder="拼音"
                            value={herb.herb_name_pinyin}
                            onChange={(e) => updateHerb(index, 'herb_name_pinyin', e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="中文"
                            value={herb.herb_name_chinese}
                            onChange={(e) => updateHerb(index, 'herb_name_chinese', e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="克"
                            value={herb.dosage_grams}
                            onChange={(e) =>
                              updateHerb(index, 'dosage_grams', parseFloat(e.target.value) || 0)
                            }
                            className="text-sm"
                            min={0}
                          />
                          <Input
                            placeholder="炮制法"
                            value={herb.processing_method}
                            onChange={(e) =>
                              updateHerb(index, 'processing_method', e.target.value)
                            }
                            className="text-sm"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeHerb(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label>用药说明</Label>
                  <Textarea
                    value={herbalInstructions}
                    onChange={(e) => setHerbalInstructions(e.target.value)}
                    placeholder="煎服方法、注意事项等..."
                    rows={2}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label>服药天数</Label>
                  <Input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                    min={1}
                    max={90}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Doctor Notes */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">医生备注</Label>
          {doctorNotesTemplates.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {doctorNotesTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="px-2.5 py-1 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                  onClick={() =>
                    setDoctorNotes((prev) => (prev ? `${prev}\n${t.content}` : t.content))
                  }
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
          <Textarea
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="医生备注、治疗计划等..."
            rows={3}
          />
        </div>

        {/* Patient Signature */}
        <Card>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <PenTool className="h-4 w-4 text-primary" />
                患者签名确认
              </Label>
              {signatureData && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    sigCanvasRef.current?.clear()
                    setSignatureData(null)
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  重签
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              本人确认已接受上述治疗，并了解相关注意事项。
            </p>
            <div className="border border-border rounded-lg bg-white overflow-hidden touch-none">
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{
                  className: 'w-full',
                  style: { width: '100%', height: 160 },
                }}
                backgroundColor="white"
                penColor="#1A1A1A"
                onEnd={() => {
                  if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
                    setSignatureData(sigCanvasRef.current.toDataURL('image/png'))
                  }
                }}
              />
            </div>
            {!signatureData && (
              <p className="text-[11px] text-muted-foreground text-center">请在上方区域手写签名</p>
            )}
          </div>
        </Card>
      </div>

      {/* Sticky save button — above BottomNav on mobile */}
      <div className="fixed bottom-14 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t md:bottom-0 md:pl-60" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-2xl mx-auto">
          <Button
            className="w-full"
            size="lg"
            onClick={() => saveVisit.mutate()}
            disabled={saveVisit.isPending}
          >
            {saveVisit.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存就诊记录
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
