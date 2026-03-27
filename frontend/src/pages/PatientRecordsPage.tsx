import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Phone,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Users,
  Camera,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { isDemoMode, DEMO_PATIENTS } from '@/lib/demo-data'
import type { Patient } from '@/types'
import { GENDER_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

const PAGE_SIZE = 20

async function uploadAvatar(file: File, patientId: string) {
  const ext = file.name.split('.').pop()
  const path = `${patientId}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

interface NewPatientForm {
  first_name: string
  last_name: string
  phone: string
  email: string
  date_of_birth: string
  gender: string
  emergency_contact_name: string
  emergency_contact_phone: string
  allergies: string
  medical_history: string
  notes: string
}

const emptyForm: NewPatientForm = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  date_of_birth: '',
  gender: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  allergies: '',
  medical_history: '',
  notes: '',
}

export default function PatientRecordsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<NewPatientForm>(emptyForm)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Debounce search
  const handleSearch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>
      return (value: string) => {
        setSearch(value)
        clearTimeout(timer)
        timer = setTimeout(() => setDebouncedSearch(value), 300)
      }
    })(),
    []
  )

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      if (isDemoMode) {
        let filtered = DEMO_PATIENTS
        if (debouncedSearch) {
          const s = debouncedSearch.toLowerCase()
          filtered = filtered.filter(p =>
            p.first_name.toLowerCase().includes(s) ||
            p.last_name.toLowerCase().includes(s) ||
            p.phone.includes(s)
          )
        }
        return { data: filtered.slice(pageParam, pageParam + PAGE_SIZE), nextOffset: pageParam + PAGE_SIZE }
      }

      let query = supabase
        .from('patients')
        .select('*')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1)

      if (debouncedSearch) {
        query = query.or(
          `first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return { data: data as Patient[], nextOffset: pageParam + PAGE_SIZE }
    },
    getNextPageParam: (lastPage) =>
      lastPage.data.length === PAGE_SIZE ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
  })

  const patients = data?.pages.flatMap((p) => p.data) ?? []

  const createPatient = useMutation({
    mutationFn: async (formData: NewPatientForm) => {
      const insertData: Record<string, unknown> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        consent_signed: false,
        is_archived: false,
      }
      if (formData.email) insertData.email = formData.email
      if (formData.date_of_birth) insertData.date_of_birth = formData.date_of_birth
      if (formData.gender) insertData.gender = formData.gender
      if (formData.emergency_contact_name)
        insertData.emergency_contact_name = formData.emergency_contact_name
      if (formData.emergency_contact_phone)
        insertData.emergency_contact_phone = formData.emergency_contact_phone
      if (formData.allergies) insertData.allergies = formData.allergies
      if (formData.medical_history) insertData.medical_history = formData.medical_history
      if (formData.notes) insertData.notes = formData.notes

      const { data, error } = await supabase
        .from('patients')
        .insert(insertData)
        .select()
        .single()
      if (error) throw error

      // Upload avatar if selected
      if (avatarFile && data) {
        const avatarUrl = await uploadAvatar(avatarFile, data.id)
        await supabase.from('patients').update({ avatar_url: avatarUrl }).eq('id', data.id)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      setDialogOpen(false)
      setForm(emptyForm)
      setAvatarFile(null)
      setAvatarPreview(null)
      toast({ title: '患者创建成功' })
    },
    onError: (error) => {
      toast({ title: `创建失败: ${error.message}`, variant: 'destructive' })
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!form.last_name || !form.first_name || !form.phone) {
      toast({ title: '请填写姓名和电话', variant: 'destructive' })
      return
    }
    createPatient.mutate(form)
  }

  const updateField = (field: keyof NewPatientForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">患者档案</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          新建患者
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索姓名或电话..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patient list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            {debouncedSearch ? '未找到匹配的患者' : '暂无患者记录'}
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {debouncedSearch ? '请尝试其他搜索条件' : '点击上方按钮添加第一位患者'}
          </p>
        </div>
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {patients.map((patient) => {
              const fullName = `${patient.last_name}${patient.first_name}`
              const initials = `${patient.last_name?.[0] ?? ''}${patient.first_name?.[0] ?? ''}`

              return (
                <motion.div key={patient.id} variants={itemVariants}>
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          {patient.avatar_url && <AvatarImage src={patient.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{fullName}</span>
                            {patient.consent_signed ? (
                              <ShieldCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <ShieldAlert className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {patient.phone}
                            </span>
                            {patient.last_visit_at && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(patient.last_visit_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {hasNextPage && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    加载中...
                  </>
                ) : (
                  '加载更多'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* New patient dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建患者</DialogTitle>
            <DialogDescription>填写患者基本信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Avatar upload */}
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {avatarPreview && <AvatarImage src={avatarPreview} />}
                    <AvatarFallback className="bg-muted">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                    <Plus className="h-3 w-3 text-white" />
                  </div>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>姓 <span className="text-destructive">*</span></Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  placeholder="王"
                />
              </div>
              <div className="space-y-1.5">
                <Label>名 <span className="text-destructive">*</span></Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  placeholder="小明"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>电话 <span className="text-destructive">*</span></Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="13800138000"
              />
            </div>

            <div className="space-y-1.5">
              <Label>邮箱</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="patient@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>出生日期</Label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => updateField('date_of_birth', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>性别</Label>
                <Select value={form.gender} onValueChange={(v) => updateField('gender', v)}>
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
                  value={form.emergency_contact_name}
                  onChange={(e) => updateField('emergency_contact_name', e.target.value)}
                  placeholder="姓名"
                />
              </div>
              <div className="space-y-1.5">
                <Label>紧急联系电话</Label>
                <Input
                  type="tel"
                  value={form.emergency_contact_phone}
                  onChange={(e) => updateField('emergency_contact_phone', e.target.value)}
                  placeholder="电话"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>过敏史</Label>
              <Textarea
                value={form.allergies}
                onChange={(e) => updateField('allergies', e.target.value)}
                placeholder="记录过敏信息..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>既往病史</Label>
              <Textarea
                value={form.medical_history}
                onChange={(e) => updateField('medical_history', e.target.value)}
                placeholder="记录既往病史..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>备注</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="其他备注信息..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={createPatient.isPending}>
              {createPatient.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  创建中...
                </>
              ) : (
                '创建患者'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
