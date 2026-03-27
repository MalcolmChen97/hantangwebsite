import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format, startOfDay, endOfDay, isPast, isFuture } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  CalendarClock,
  Loader2,
  RefreshCw,
  Play,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatTime } from '@/lib/utils'
import { isDemoMode, DEMO_APPOINTMENTS } from '@/lib/demo-data'
import type { Appointment, AppointmentStatus } from '@/types'
import { SERVICE_TYPE_LABELS, STATUS_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const today = new Date()
const todayStart = startOfDay(today).toISOString()
const todayEnd = endOfDay(today).toISOString()

// Derive display status based on time
function getDisplayStatus(apt: Appointment): AppointmentStatus {
  if (apt.status === 'cancelled' || apt.status === 'no_show') return apt.status
  if (apt.status === 'completed') return 'completed'
  if (apt.status === 'in_progress') return 'in_progress'

  const now = new Date()
  const start = new Date(apt.start_time)
  const end = new Date(apt.end_time)

  if (now >= end) return 'completed'
  if (now >= start) return 'arrived'
  return apt.status // scheduled or confirmed
}

const SERVICE_COLORS: Record<string, string> = {
  acupuncture: 'bg-amber-50 text-amber-700',
  herbal_consultation: 'bg-emerald-50 text-emerald-700',
  initial_consultation: 'bg-blue-50 text-blue-700',
  follow_up: 'bg-slate-50 text-slate-600',
  other: 'bg-slate-50 text-slate-600',
}

const STATUS_BADGE: Record<string, { color: string; dot: string }> = {
  scheduled: { color: 'text-blue-600 bg-blue-50', dot: 'bg-blue-500' },
  confirmed: { color: 'text-primary bg-primary/10', dot: 'bg-primary' },
  arrived: { color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-500' },
  in_progress: { color: 'text-orange-600 bg-orange-50', dot: 'bg-orange-500' },
  completed: { color: 'text-green-600 bg-green-50', dot: 'bg-green-500' },
  cancelled: { color: 'text-gray-400 bg-gray-50', dot: 'bg-gray-400' },
  no_show: { color: 'text-red-600 bg-red-50', dot: 'bg-red-500' },
}

export default function TodaySchedulePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)

  const {
    data: rawAppointments = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: async () => {
      if (isDemoMode) return DEMO_APPOINTMENTS
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patients(*)')
        .gte('start_time', todayStart)
        .lt('start_time', todayEnd)
        .order('start_time')
      if (error) throw error
      return data as Appointment[]
    },
    refetchOnWindowFocus: true,
  })

  // Apply time-based status
  const appointments = useMemo(
    () => rawAppointments.map((apt) => ({ ...apt, displayStatus: getDisplayStatus(apt) })),
    [rawAppointments]
  )

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      if (isDemoMode) return
      const { error } = await supabase
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] })
      toast('状态已更新', 'success')
    },
    onError: () => {
      toast('更新失败，请重试', 'error')
    },
  })

  const reschedule = useMutation({
    mutationFn: async ({ id, startTime }: { id: string; startTime: string }) => {
      if (isDemoMode) return
      const start = new Date(startTime)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const { error } = await supabase
        .from('appointments')
        .update({ start_time: start.toISOString(), end_time: end.toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] })
      setRescheduleId(null)
      toast('改期成功', 'success')
    },
    onError: () => {
      toast('改期失败，请重试', 'error')
    },
  })

  const totalCount = appointments.length
  const remainingCount = appointments.filter((a) => !['completed', 'cancelled', 'no_show'].includes(a.displayStatus)).length
  const completedCount = appointments.filter((a) => a.displayStatus === 'completed').length

  const handleReschedule = () => {
    if (!rescheduleId || !rescheduleDate || !rescheduleTime) return
    reschedule.mutate({ id: rescheduleId, startTime: `${rescheduleDate}T${rescheduleTime}` })
  }

  const handleCancel = () => {
    if (!cancelId) return
    updateStatus.mutate({ id: cancelId, status: 'cancelled' })
    setCancelId(null)
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">今日日程</h1>
          <p className="text-sm text-muted-foreground">
            {format(today, 'yyyy年M月d日 EEEE', { locale: zhCN })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: CalendarDays, value: totalCount, label: '总预约', color: 'text-blue-500' },
          { icon: Clock, value: remainingCount, label: '剩余', color: 'text-amber-500' },
          { icon: CheckCircle2, value: completedCount, label: '已完成', color: 'text-green-500' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 text-center">
            <stat.icon className={cn('h-4 w-4 mx-auto mb-1', stat.color)} />
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Appointment list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-medium text-muted-foreground">今日暂无预约</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">可以去日历页面添加新预约</p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          className="space-y-2"
        >
          {appointments.map((apt) => {
            const patient = apt.patient
            const name = patient ? `${patient.last_name}${patient.first_name}` : '未知患者'
            const initials = patient ? `${patient.last_name?.[0] ?? ''}` : '?'
            const status = apt.displayStatus
            const badge = STATUS_BADGE[status] ?? STATUS_BADGE.scheduled
            const isActive = !['completed', 'cancelled', 'no_show'].includes(status)
            const isNow = status === 'arrived' || status === 'in_progress'

            return (
              <motion.div key={apt.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                <Card className={cn('p-3 transition-all', isNow && 'ring-1 ring-primary/20 bg-primary/[0.02]')}>
                  <div className="flex items-start gap-3">
                    {/* Time column */}
                    <div className="w-14 shrink-0 pt-0.5 text-center">
                      <p className="text-sm font-semibold text-foreground">{formatTime(apt.start_time)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatTime(apt.end_time)}</p>
                    </div>

                    {/* Divider */}
                    <div className="w-px self-stretch bg-border" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-7 w-7">
                          {patient?.avatar_url && <AvatarImage src={patient.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm text-foreground">{name}</span>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 border-0', SERVICE_COLORS[apt.service_type])}>
                          {SERVICE_TYPE_LABELS[apt.service_type]}
                        </Badge>
                      </div>

                      {/* Status + notes */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full', badge.color)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', badge.dot)} />
                          {STATUS_LABELS[status]}
                        </span>
                        {apt.notes && (
                          <span className="text-[11px] text-muted-foreground truncate">{apt.notes}</span>
                        )}
                      </div>

                      {/* Actions */}
                      {isActive && (
                        <div className="flex items-center gap-1 mt-2">
                          {(status === 'arrived') && (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2.5"
                              onClick={() => navigate(`/visits/new?patient_id=${apt.patient_id}&appointment_id=${apt.id}`)}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              开始就诊
                            </Button>
                          )}
                          {(status === 'scheduled' || status === 'confirmed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2.5"
                              onClick={() => navigate(`/visits/new?patient_id=${apt.patient_id}&appointment_id=${apt.id}`)}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              就诊
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2"
                            onClick={() => {
                              setRescheduleId(apt.id)
                              setRescheduleDate(format(new Date(apt.start_time), 'yyyy-MM-dd'))
                              setRescheduleTime(format(new Date(apt.start_time), 'HH:mm'))
                            }}
                          >
                            改期
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                            onClick={() => setCancelId(apt.id)}
                          >
                            取消
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2"
                            onClick={() => toast('短信提醒功能即将上线')}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Reschedule dialog */}
      <Dialog open={!!rescheduleId} onOpenChange={(open) => !open && setRescheduleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>改期预约</DialogTitle>
            <DialogDescription>选择新的日期和时间</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>日期</Label>
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>时间</Label>
              <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
            <Button onClick={handleReschedule} disabled={reschedule.isPending}>
              {reschedule.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              确认改期
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>取消预约</DialogTitle>
            <DialogDescription>
              <div className="flex items-start gap-2 mt-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <span>确定要取消此预约吗？此操作无法撤销。</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">返回</Button></DialogClose>
            <Button variant="destructive" onClick={handleCancel}>确认取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
