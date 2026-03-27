import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CircleDot,
  Flame,
  Zap,
  Pill,
  Clock,
  FileText,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { isDemoMode, DEMO_VISITS, DEMO_PATIENTS } from '@/lib/demo-data'
import type { VisitRecord, AcupunctureDetail, HerbalPrescription, HerbItem } from '@/types'
import { TREATMENT_TYPE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: visit, isLoading } = useQuery({
    queryKey: ['visit', id],
    queryFn: async () => {
      if (isDemoMode) {
        const v = DEMO_VISITS.find(v => v.id === id)
        if (v) return { ...v, patient: DEMO_PATIENTS.find(p => p.id === v.patient_id) } as VisitRecord
        return null
      }
      const { data, error } = await supabase.from('visit_records').select('*, patient:patients(*)').eq('id', id!).single()
      if (error) throw error
      return data as VisitRecord
    },
    enabled: !!id,
  })

  const { data: acupunctureDetails = [] } = useQuery({
    queryKey: ['visit-acupuncture', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acupuncture_details')
        .select('*')
        .eq('visit_record_id', id!)
      if (error) throw error
      return data as AcupunctureDetail[]
    },
    enabled: !!id,
  })

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['visit-prescriptions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('herbal_prescriptions')
        .select('*, herb_items(*)')
        .eq('visit_record_id', id!)
      if (error) throw error
      return data as (HerbalPrescription & { herb_items: HerbItem[] })[]
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!visit) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">未找到就诊记录</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>
    )
  }

  const patient = visit.patient
  const fullName = patient ? `${patient.last_name}${patient.first_name}` : '未知患者'
  const initials = patient
    ? `${patient.last_name?.[0] ?? ''}${patient.first_name?.[0] ?? ''}`
    : '?'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Patient & Visit info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                {patient?.avatar_url && <AvatarImage src={patient.avatar_url} />}
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{fullName}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(visit.visit_datetime)}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {TREATMENT_TYPE_LABELS[visit.treatment_type]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Chief Complaint */}
        {visit.chief_complaint && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                主诉
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-900">{visit.chief_complaint}</p>
            </CardContent>
          </Card>
        )}

        {/* TCM Diagnostics */}
        {(visit.tongue_diagnosis || visit.pulse_diagnosis || visit.tcm_pattern) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                四诊 / 辨证
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {visit.tongue_diagnosis && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-12 shrink-0">
                    舌诊
                  </span>
                  <span className="text-sm text-gray-900">{visit.tongue_diagnosis}</span>
                </div>
              )}
              {visit.pulse_diagnosis && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-12 shrink-0">
                    脉诊
                  </span>
                  <span className="text-sm text-gray-900">{visit.pulse_diagnosis}</span>
                </div>
              )}
              {visit.tcm_pattern && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-12 shrink-0">
                    辨证
                  </span>
                  <span className="text-sm text-gray-900 font-medium">{visit.tcm_pattern}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Acupuncture Details */}
        {acupunctureDetails.map((detail) => (
          <Card key={detail.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <CircleDot className="h-4 w-4 text-primary" />
                针灸治疗
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Acupoints */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">穴位</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.acupoints.map((point) => (
                    <Badge key={point} variant="secondary">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Details row */}
              <div className="flex flex-wrap gap-4 text-sm">
                {detail.needle_retention_min && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    留针 {detail.needle_retention_min} 分钟
                  </span>
                )}
                {detail.moxa_used && (
                  <span className="flex items-center gap-1 text-orange-600">
                    <Flame className="h-3.5 w-3.5" />
                    艾灸
                  </span>
                )}
                {detail.electro_stim_used && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Zap className="h-3.5 w-3.5" />
                    电针
                  </span>
                )}
                {detail.cupping_used && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <CircleDot className="h-3.5 w-3.5" />
                    拔罐
                  </span>
                )}
              </div>

              {detail.technique_notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">手法备注</p>
                  <p className="text-sm text-gray-700">{detail.technique_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Herbal Prescriptions */}
        {prescriptions.map((rx) => (
          <Card key={rx.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-amber-600" />
                中药处方
                {rx.formula_name && (
                  <span className="text-gray-900 font-bold ml-1">{rx.formula_name}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Herb table */}
              {rx.herb_items && rx.herb_items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-1.5 font-medium">药材</th>
                        <th className="text-left py-1.5 font-medium">中文名</th>
                        <th className="text-right py-1.5 font-medium">剂量 (g)</th>
                        <th className="text-left py-1.5 font-medium pl-4">炮制</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rx.herb_items
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((herb) => (
                          <tr key={herb.id} className="border-b border-dashed last:border-0">
                            <td className="py-1.5 text-gray-900">{herb.herb_name_pinyin}</td>
                            <td className="py-1.5 text-gray-700">
                              {herb.herb_name_chinese ?? '-'}
                            </td>
                            <td className="py-1.5 text-right font-mono">{herb.dosage_grams}</td>
                            <td className="py-1.5 pl-4 text-gray-600">
                              {herb.processing_method ?? '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {rx.instructions && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">用药说明</p>
                  <p className="text-sm text-gray-700">{rx.instructions}</p>
                </div>
              )}

              <div className="flex gap-4 text-sm text-muted-foreground">
                {rx.duration_days && <span>服药天数: {rx.duration_days} 天</span>}
                {rx.refills != null && rx.refills > 0 && <span>续方: {rx.refills} 次</span>}
              </div>

              {rx.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">处方备注</p>
                  <p className="text-sm text-gray-700">{rx.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Doctor Notes */}
        {visit.doctor_notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                医生备注
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-900 whitespace-pre-wrap">{visit.doctor_notes}</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
