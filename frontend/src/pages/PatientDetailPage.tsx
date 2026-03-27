import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Plus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatDateTime } from '@/lib/utils'
import { isDemoMode, DEMO_PATIENTS, DEMO_VISITS, DEMO_CONSENTS } from '@/lib/demo-data'
import type { Patient, VisitRecord, ConsentRecord, ConsentType, ServiceType } from '@/types'
import { GENDER_LABELS, TREATMENT_TYPE_LABELS, SERVICE_TYPE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { TimeSlotPicker } from '@/components/TimeSlotPicker'

const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  initial_consent: '初诊知情同意书',
  acupuncture_consent: '针灸治疗同意书',
  post_treatment_confirmation: '治疗确认',
}

function InfoRow({ icon, label, value, href }: { icon?: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {href ? (
        <a href={href} className="text-sm text-primary hover:underline">{value}</a>
      ) : (
        <span className="text-sm text-gray-900">{value}</span>
      )}
    </div>
  )
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Patient>>({})

  // Appointment booking
  const [aptDialog, setAptDialog] = useState(false)
  const [aptServiceType, setAptServiceType] = useState<ServiceType>('acupuncture')
  const [aptDate, setAptDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [aptTime, setAptTime] = useState('09:00')
  const [aptNotes, setAptNotes] = useState('')

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (isDemoMode) return DEMO_PATIENTS.find(p => p.id === id) ?? null
      const { data, error } = await supabase.from('patients').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Patient
    },
    enabled: !!id,
  })

  const { data: visits = [], isLoading: visitsLoading } = useQuery({
    queryKey: ['patient-visits', id],
    queryFn: async () => {
      if (isDemoMode) return DEMO_VISITS.filter(v => v.patient_id === id).sort((a, b) => new Date(b.visit_datetime).getTime() - new Date(a.visit_datetime).getTime())
      const { data, error } = await supabase.from('visit_records').select('*').eq('patient_id', id!).order('visit_datetime', { ascending: false })
      if (error) throw error
      return data as VisitRecord[]
    },
    enabled: !!id,
  })

  const { data: consents = [], isLoading: consentsLoading } = useQuery({
    queryKey: ['patient-consents', id],
    queryFn: async () => {
      if (isDemoMode) return DEMO_CONSENTS.filter(c => c.patient_id === id).sort((a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime())
      const { data, error } = await supabase.from('consent_records').select('*').eq('patient_id', id!).order('signed_at', { ascending: false })
      if (error) throw error
      return data as ConsentRecord[]
    },
    enabled: !!id,
  })

  const updatePatient = useMutation({
    mutationFn: async (updates: Partial<Patient>) => {
      const { error } = await supabase
        .from('patients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] })
      setEditing(false)
      toast({ title: '患者信息已更新' })
    },
    onError: (error) => {
      toast({ title: `更新失败: ${error.message}`, variant: 'destructive' })
    },
  })

  const createAppointment = useMutation({
    mutationFn: async () => {
      const startTime = new Date(`${aptDate}T${aptTime}`)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
      const { error } = await supabase.from('appointments').insert({
        patient_id: id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        service_type: aptServiceType,
        status: 'scheduled',
        notes: aptNotes || null,
        sms_confirmation_sent: false,
        sms_reminder_24h_sent: false,
        sms_reminder_2h_sent: false,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setAptDialog(false)
      setAptNotes('')
      toast({ title: '预约创建成功' })
    },
    onError: (err) => {
      toast({ title: `预约失败: ${err.message}`, variant: 'destructive' })
    },
  })

  const startEdit = () => {
    if (!patient) return
    setEditForm({
      first_name: patient.first_name,
      last_name: patient.last_name,
      phone: patient.phone,
      email: patient.email ?? '',
      date_of_birth: patient.date_of_birth ?? '',
      gender: patient.gender,
      emergency_contact_name: patient.emergency_contact_name ?? '',
      emergency_contact_phone: patient.emergency_contact_phone ?? '',
      allergies: patient.allergies ?? '',
      medical_history: patient.medical_history ?? '',
      notes: patient.notes ?? '',
    })
    setEditing(true)
  }

  const handleSave = () => {
    updatePatient.mutate(editForm)
  }

  const updateField = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  if (patientLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">未找到患者信息</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/patients')}>
          返回患者列表
        </Button>
      </div>
    )
  }

  const fullName = `${patient.last_name}${patient.first_name}`
  const initials = `${patient.last_name?.[0] ?? ''}${patient.first_name?.[0] ?? ''}`

  return (
    <div className="space-y-4">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-4 w-4 mr-1" />
              取消
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updatePatient.isPending}>
              {updatePatient.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              保存
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAptDialog(true)}>
              <Calendar className="h-4 w-4 mr-1" />
              预约治疗
            </Button>
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Edit3 className="h-4 w-4 mr-1" />
              编辑
            </Button>
          </div>
        )}
      </div>

      {/* Patient header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {patient.avatar_url && <AvatarImage src={patient.avatar_url} />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <a href={`tel:${patient.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="h-3.5 w-3.5" />
              {patient.phone}
            </a>
            {patient.gender && (
              <span>{GENDER_LABELS[patient.gender]}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {patient.consent_signed ? (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                <ShieldCheck className="h-3 w-3 mr-1" />
                已签同意书
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                <ShieldAlert className="h-3 w-3 mr-1" />
                未签同意书
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="info">基本信息</TabsTrigger>
          <TabsTrigger value="visits">就诊记录 ({visits.length})</TabsTrigger>
          <TabsTrigger value="consents">同意书 ({consents.length})</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="info" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="p-6 space-y-4">
                {editing ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>姓</Label>
                        <Input
                          value={editForm.last_name ?? ''}
                          onChange={(e) => updateField('last_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>名</Label>
                        <Input
                          value={editForm.first_name ?? ''}
                          onChange={(e) => updateField('first_name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>电话</Label>
                      <Input
                        value={editForm.phone ?? ''}
                        onChange={(e) => updateField('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>邮箱</Label>
                      <Input
                        type="email"
                        value={editForm.email ?? ''}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>出生日期</Label>
                        <Input
                          type="date"
                          value={editForm.date_of_birth ?? ''}
                          onChange={(e) => updateField('date_of_birth', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>性别</Label>
                        <Select
                          value={editForm.gender ?? ''}
                          onValueChange={(v) => updateField('gender', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择性别" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(GENDER_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>紧急联系人</Label>
                        <Input
                          value={editForm.emergency_contact_name ?? ''}
                          onChange={(e) => updateField('emergency_contact_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>紧急联系电话</Label>
                        <Input
                          value={editForm.emergency_contact_phone ?? ''}
                          onChange={(e) => updateField('emergency_contact_phone', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>过敏史</Label>
                      <Textarea
                        value={editForm.allergies ?? ''}
                        onChange={(e) => updateField('allergies', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>既往病史</Label>
                      <Textarea
                        value={editForm.medical_history ?? ''}
                        onChange={(e) => updateField('medical_history', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>备注</Label>
                      <Textarea
                        value={editForm.notes ?? ''}
                        onChange={(e) => updateField('notes', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <InfoRow icon={<Phone className="h-4 w-4" />} label="电话" value={patient.phone} href={`tel:${patient.phone}`} />
                    <InfoRow icon={<Mail className="h-4 w-4" />} label="邮箱" value={patient.email ?? '未填写'} />
                    <InfoRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="出生日期"
                      value={patient.date_of_birth ? formatDate(patient.date_of_birth) : '未填写'}
                    />
                    <InfoRow label="性别" value={patient.gender ? GENDER_LABELS[patient.gender] : '未填写'} />
                    <InfoRow label="紧急联系人" value={patient.emergency_contact_name ?? '未填写'} />
                    <InfoRow label="紧急联系电话" value={patient.emergency_contact_phone ?? '未填写'} />

                    {patient.allergies && (
                      <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-destructive mb-1">
                          <AlertTriangle className="h-4 w-4" />
                          过敏史
                        </div>
                        <p className="text-sm text-gray-700">{patient.allergies}</p>
                      </div>
                    )}

                    {patient.medical_history && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">既往病史</p>
                        <p className="text-sm text-gray-700">{patient.medical_history}</p>
                      </div>
                    )}

                    {patient.notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">备注</p>
                        <p className="text-sm text-gray-700">{patient.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Visits Tab */}
        <TabsContent value="visits" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => navigate(`/visits/new?patient_id=${id}`)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                新建就诊记录
              </Button>
            </div>
            {visitsLoading ? (
              [1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : visits.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">暂无就诊记录</p>
              </div>
            ) : (
              visits.map((visit) => (
                <Card
                  key={visit.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/visits/${visit.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDateTime(visit.visit_datetime)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {TREATMENT_TYPE_LABELS[visit.treatment_type]}
                          </Badge>
                          {visit.chief_complaint && (
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {visit.chief_complaint}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        </TabsContent>

        {/* Consents Tab */}
        <TabsContent value="consents" className="mt-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/signature/initial_consent?patient_id=${id}`)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                初诊同意书
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/signature/acupuncture_consent?patient_id=${id}`)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                针灸同意书
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/signature/post_treatment_confirmation?patient_id=${id}`)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                治疗确认
              </Button>
            </div>

            {consentsLoading ? (
              [1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ))
            ) : consents.length === 0 ? (
              <div className="text-center py-12">
                <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">暂无签署记录</p>
                <p className="text-sm text-muted-foreground/70 mt-1">点击上方按钮创建同意书</p>
              </div>
            ) : (
              consents.map((consent) => (
                <Card key={consent.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {CONSENT_TYPE_LABELS[consent.consent_type]}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          签署于 {formatDateTime(consent.signed_at)}
                        </p>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* New Appointment Dialog */}
      <Dialog open={aptDialog} onOpenChange={setAptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>预约治疗</DialogTitle>
            <DialogDescription>为 {fullName} 创建预约</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>服务类型</Label>
              <Select
                value={aptServiceType}
                onValueChange={(v) => setAptServiceType(v as ServiceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>日期与时间</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={aptDate}
                  onChange={(e) => setAptDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={aptTime}
                  onChange={(e) => setAptTime(e.target.value)}
                  className="w-28"
                />
                <TimeSlotPicker
                  date={aptDate}
                  time={aptTime}
                  onDateChange={setAptDate}
                  onTimeChange={setAptTime}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={aptNotes}
                onChange={(e) => setAptNotes(e.target.value)}
                placeholder="预约备注..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button
              onClick={() => createAppointment.mutate()}
              disabled={createAppointment.isPending}
            >
              {createAppointment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              创建预约
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
