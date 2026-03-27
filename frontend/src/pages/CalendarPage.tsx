import { useState, useMemo, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  format,
  addDays,
  addWeeks,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  isSameDay,
  isToday,
  differenceInMinutes,
  parseISO,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  X,
  Clock,
  Search,
  Loader2,
  Ban,
  Phone,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatTime } from '@/lib/utils'
import { isDemoMode, DEMO_APPOINTMENTS, DEMO_PATIENTS } from '@/lib/demo-data'
import type { Appointment, Patient, ServiceType, BlockedTime } from '@/types'
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { TimeSlotPicker } from '@/components/TimeSlotPicker'

const WORK_START = 8
const WORK_END = 20
const HOURS = Array.from({ length: WORK_END - WORK_START }, (_, i) => WORK_START + i)
const HOUR_HEIGHT = 64 // px per hour

type ViewMode = 'week' | 'day'

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [newAptDialog, setNewAptDialog] = useState(false)
  const [blockDialog, setBlockDialog] = useState(false)
  const [viewAptDialog, setViewAptDialog] = useState<Appointment | null>(null)
  const [rescheduleMode, setRescheduleMode] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [patientSearch, setPatientSearch] = useState('')

  // New appointment form
  const [newAptPatientId, setNewAptPatientId] = useState('')
  const [newAptServiceType, setNewAptServiceType] = useState<ServiceType>('acupuncture')
  const [newAptDate, setNewAptDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newAptStartTime, setNewAptStartTime] = useState('09:00')
  const [newAptEndTime, setNewAptEndTime] = useState('10:00')
  const [newAptNotes, setNewAptNotes] = useState('')

  // Block time form
  const [blockDate, setBlockDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [blockStart, setBlockStart] = useState('12:00')
  const [blockEnd, setBlockEnd] = useState('13:00')
  const [blockReason, setBlockReason] = useState('')

  // Drag-to-select state
  const dragRef = useRef<{
    active: boolean
    date: Date
    startY: number
    columnTop: number
  } | null>(null)
  const [dragPreview, setDragPreview] = useState<{
    date: string // ISO
    topMin: number // minutes from WORK_START
    bottomMin: number
  } | null>(null)

  const SNAP_MINUTES = 15
  const yToMinutes = (y: number, columnTop: number) => {
    const rawMin = ((y - columnTop) / HOUR_HEIGHT) * 60
    return Math.round(rawMin / SNAP_MINUTES) * SNAP_MINUTES
  }

  const minutesToTimeStr = (min: number) => {
    const totalMin = WORK_START * 60 + min
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, date: Date) => {
    // Don't start drag on appointment clicks
    if ((e.target as HTMLElement).closest('[data-apt]')) return
    const column = (e.currentTarget as HTMLElement)
    const rect = column.getBoundingClientRect()
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const min = yToMinutes(clientY, rect.top)
    const clampedMin = Math.max(0, Math.min(min, (WORK_END - WORK_START) * 60 - SNAP_MINUTES))

    dragRef.current = {
      active: true,
      date,
      startY: clampedMin,
      columnTop: rect.top,
    }
    setDragPreview({
      date: date.toISOString(),
      topMin: clampedMin,
      bottomMin: clampedMin + SNAP_MINUTES,
    })
  }

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current?.active) return
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const min = yToMinutes(clientY, dragRef.current.columnTop)
    const maxMin = (WORK_END - WORK_START) * 60
    const clampedMin = Math.max(0, Math.min(min, maxMin))

    const startMin = dragRef.current.startY
    setDragPreview({
      date: dragRef.current.date.toISOString(),
      topMin: Math.min(startMin, clampedMin),
      bottomMin: Math.max(startMin + SNAP_MINUTES, clampedMin),
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current?.active || !dragPreview) {
      dragRef.current = null
      setDragPreview(null)
      return
    }

    const date = dragRef.current.date
    setNewAptDate(format(date, 'yyyy-MM-dd'))
    setNewAptStartTime(minutesToTimeStr(dragPreview.topMin))
    setNewAptEndTime(minutesToTimeStr(dragPreview.bottomMin))
    setNewAptDialog(true)

    dragRef.current = null
    setDragPreview(null)
  }, [dragPreview])

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const rangeStart = viewMode === 'week' ? weekStart : startOfDay(currentDate)
  const rangeEnd = viewMode === 'week' ? weekEnd : endOfDay(currentDate)

  // Fetch appointments
  const { data: appointments = [], isLoading: aptsLoading } = useQuery({
    queryKey: ['calendar-appointments', rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      if (isDemoMode) {
        return DEMO_APPOINTMENTS.filter(a => {
          const t = new Date(a.start_time)
          return t >= rangeStart && t <= rangeEnd && a.status !== 'cancelled'
        })
      }
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patients(*)')
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .neq('status', 'cancelled')
        .order('start_time')
      if (error) throw error
      return data as Appointment[]
    },
  })

  // Fetch blocked times
  const { data: blockedTimes = [] } = useQuery({
    queryKey: ['blocked-times', rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      if (isDemoMode) return [] as BlockedTime[]
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*')
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .order('start_time')
      if (error) throw error
      return data as BlockedTime[]
    },
  })

  // Search patients for new appointment
  const { data: searchedPatients = [] } = useQuery({
    queryKey: ['patient-search', patientSearch],
    queryFn: async () => {
      if (!patientSearch) return []
      if (isDemoMode) {
        const s = patientSearch.toLowerCase()
        return DEMO_PATIENTS.filter(p =>
          p.first_name.toLowerCase().includes(s) ||
          p.last_name.toLowerCase().includes(s) ||
          p.phone.includes(s)
        ).slice(0, 10)
      }
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('is_archived', false)
        .or(
          `first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,phone.ilike.%${patientSearch}%`
        )
        .limit(10)
      if (error) throw error
      return data as Patient[]
    },
    enabled: patientSearch.length > 0,
  })

  // Create appointment mutation
  const createAppointment = useMutation({
    mutationFn: async () => {
      const startTime = new Date(`${newAptDate}T${newAptStartTime}`)
      const endTime = new Date(`${newAptDate}T${newAptEndTime}`)
      const { error } = await supabase.from('appointments').insert({
        patient_id: newAptPatientId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        service_type: newAptServiceType,
        status: 'scheduled',
        notes: newAptNotes || null,
        sms_confirmation_sent: false,
        sms_reminder_24h_sent: false,
        sms_reminder_2h_sent: false,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] })
      setNewAptDialog(false)
      resetNewAptForm()
      toast({ title: '预约创建成功' })
    },
    onError: (err) => {
      toast({ title: `创建失败: ${err.message}`, variant: 'destructive' })
    },
  })

  // Block time mutation
  const createBlockedTime = useMutation({
    mutationFn: async () => {
      const startTime = new Date(`${blockDate}T${blockStart}`)
      const endTime = new Date(`${blockDate}T${blockEnd}`)
      const { error } = await supabase.from('blocked_times').insert({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        reason: blockReason || null,
        recurring: false,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-times'] })
      setBlockDialog(false)
      setBlockReason('')
      toast({ title: '时间已屏蔽' })
    },
    onError: (err) => {
      toast({ title: `操作失败: ${err.message}`, variant: 'destructive' })
    },
  })

  // Cancel appointment
  const cancelAppointment = useMutation({
    mutationFn: async (id: string) => {
      if (isDemoMode) return
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] })
      setViewAptDialog(null)
      toast({ title: '预约已取消' })
    },
    onError: (err) => {
      toast({ title: `取消失败: ${err.message}`, variant: 'destructive' })
    },
  })

  // Reschedule appointment
  const rescheduleAppointment = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] })
      setViewAptDialog(null)
      setRescheduleMode(false)
      toast({ title: '改期成功' })
    },
    onError: (err) => {
      toast({ title: `改期失败: ${err.message}`, variant: 'destructive' })
    },
  })

  const resetNewAptForm = () => {
    setNewAptPatientId('')
    setNewAptServiceType('acupuncture')
    setNewAptStartTime('09:00')
    setNewAptEndTime('10:00')
    setNewAptNotes('')
    setPatientSearch('')
  }

  const navigatePrev = () => {
    if (viewMode === 'week') setCurrentDate((d) => addWeeks(d, -1))
    else setCurrentDate((d) => addDays(d, -1))
  }

  const navigateNext = () => {
    if (viewMode === 'week') setCurrentDate((d) => addWeeks(d, 1))
    else setCurrentDate((d) => addDays(d, 1))
  }

  const goToday = () => setCurrentDate(new Date())

  const getAppointmentsForDay = useCallback(
    (date: Date) => appointments.filter((a) => isSameDay(parseISO(a.start_time), date)),
    [appointments]
  )

  const getBlockedTimesForDay = useCallback(
    (date: Date) => blockedTimes.filter((b) => isSameDay(parseISO(b.start_time), date)),
    [blockedTimes]
  )

  const getBlockStyle = (bt: BlockedTime) => {
    const start = parseISO(bt.start_time)
    const end = parseISO(bt.end_time)
    const startMin = (start.getHours() - WORK_START) * 60 + start.getMinutes()
    const duration = differenceInMinutes(end, start)
    return {
      top: `${(startMin / 60) * HOUR_HEIGHT}px`,
      height: `${(duration / 60) * HOUR_HEIGHT}px`,
    }
  }

  const getAptStyle = (apt: Appointment) => {
    const start = parseISO(apt.start_time)
    const end = parseISO(apt.end_time)
    const startMin = (start.getHours() - WORK_START) * 60 + start.getMinutes()
    const duration = differenceInMinutes(end, start)
    return {
      top: `${(startMin / 60) * HOUR_HEIGHT}px`,
      height: `${Math.max((duration / 60) * HOUR_HEIGHT, 24)}px`,
    }
  }

  const renderDayColumn = (date: Date) => {
    const dayApts = getAppointmentsForDay(date)
    const dayBlocks = getBlockedTimesForDay(date)
    const dateISO = date.toISOString()
    const showPreview = dragPreview && dragPreview.date === dateISO

    return (
      <div
        key={dateISO}
        className="relative select-none touch-none"
        style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
        onMouseDown={(e) => handleDragStart(e, date)}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={() => { if (dragRef.current?.active) handleDragEnd() }}
        onTouchStart={(e) => handleDragStart(e, date)}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {/* Hour grid lines */}
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute w-full border-t border-border/50"
            style={{ top: `${(hour - WORK_START) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
          />
        ))}

        {/* Drag preview */}
        {showPreview && (
          <div
            className="absolute left-1 right-1 bg-primary/20 border-2 border-primary/50 rounded-md z-30 pointer-events-none flex items-center justify-center"
            style={{
              top: `${(dragPreview.topMin / 60) * HOUR_HEIGHT}px`,
              height: `${Math.max(((dragPreview.bottomMin - dragPreview.topMin) / 60) * HOUR_HEIGHT, 20)}px`,
            }}
          >
            <span className="text-xs font-medium text-primary">
              {minutesToTimeStr(dragPreview.topMin)} - {minutesToTimeStr(dragPreview.bottomMin)}
            </span>
          </div>
        )}

        {/* Blocked times */}
        {dayBlocks.map((bt) => (
          <div
            key={bt.id}
            className="absolute left-1 right-1 bg-gray-100 border border-dashed border-gray-300 rounded-md flex items-center justify-center z-10"
            style={getBlockStyle(bt)}
          >
            <span className="text-xs text-gray-400 px-1 truncate">
              {bt.reason || '已屏蔽'}
            </span>
          </div>
        ))}

        {/* Appointments */}
        {dayApts.map((apt) => {
          const patient = apt.patient
          const name = patient ? `${patient.last_name}${patient.first_name}` : '未知'
          return (
            <div
              key={apt.id}
              data-apt
              className={cn(
                'absolute left-1 right-1 rounded-md px-1.5 py-0.5 cursor-pointer overflow-hidden border z-20 transition-shadow hover:shadow-md',
                SERVICE_TYPE_COLORS[apt.service_type]
              )}
              style={getAptStyle(apt)}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                setViewAptDialog(apt)
              }}
            >
              <p className="text-xs font-medium truncate">{name}</p>
              <p className="text-[10px] opacity-70 truncate">
                {formatTime(apt.start_time)} {SERVICE_TYPE_LABELS[apt.service_type]}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="py-2 border-b bg-background sticky top-0 z-30">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-foreground">日历</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setBlockDialog(true)}>
              <Ban className="h-3.5 w-3.5 mr-1" />
              屏蔽时间
            </Button>
            <Button size="sm" onClick={() => setNewAptDialog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              新预约
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="shrink-0" onClick={goToday}>
              今天
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium ml-1 md:ml-2 truncate">
              {viewMode === 'week'
                ? `${format(weekStart, 'M月d日', { locale: zhCN })} - ${format(weekEnd, 'M月d日', { locale: zhCN })}`
                : format(currentDate, 'yyyy年M月d日 EEE', { locale: zhCN })}
            </span>
          </div>
          <div className="flex border rounded-lg overflow-hidden shrink-0">
            <button
              className={cn(
                'px-3 py-1 text-xs font-medium transition-colors',
                viewMode === 'week'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              )}
              onClick={() => setViewMode('week')}
            >
              周
            </button>
            <button
              className={cn(
                'px-3 py-1 text-xs font-medium transition-colors',
                viewMode === 'day'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              )}
              onClick={() => setViewMode('day')}
            >
              日
            </button>
          </div>
        </div>
      </div>

      {/* Calendar body */}
      {aptsLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === 'week' ? (
        <div className="flex-1 overflow-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)] sticky top-0 bg-background z-20 border-b">
              <div className="p-2" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'p-2 text-center border-l cursor-pointer hover:bg-muted/50 transition-colors',
                    isToday(day) && 'bg-primary/5'
                  )}
                  onClick={() => {
                    setCurrentDate(day)
                    setViewMode('day')
                  }}
                >
                  <p className="text-xs text-muted-foreground">
                    {format(day, 'EEE', { locale: zhCN })}
                  </p>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isToday(day) &&
                        'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto'
                    )}
                  >
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)]">
              {/* Time labels */}
              <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full text-right pr-2 text-xs text-muted-foreground -translate-y-1/2"
                    style={{ top: `${(hour - WORK_START) * HOUR_HEIGHT}px` }}
                  >
                    {`${String(hour).padStart(2, '0')}:00`}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="border-l">
                  {renderDayColumn(day)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Day view */
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[56px_1fr]">
            {/* Time labels */}
            <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute w-full text-right pr-2 text-xs text-muted-foreground -translate-y-1/2"
                  style={{ top: `${(hour - WORK_START) * HOUR_HEIGHT}px` }}
                >
                  {`${String(hour).padStart(2, '0')}:00`}
                </div>
              ))}
            </div>

            {/* Single day column */}
            <div className="border-l">{renderDayColumn(currentDate)}</div>
          </div>
        </div>
      )}

      {/* New Appointment Dialog */}
      <Dialog open={newAptDialog} onOpenChange={setNewAptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建预约</DialogTitle>
            <DialogDescription>选择患者和时间段</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Patient search */}
            <div className="space-y-2">
              <Label>患者</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索患者姓名或电话..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchedPatients.length > 0 && (
                <div className="border rounded-lg max-h-32 overflow-y-auto">
                  {searchedPatients.map((p) => (
                    <button
                      key={p.id}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors',
                        newAptPatientId === p.id && 'bg-primary/10'
                      )}
                      onClick={() => {
                        setNewAptPatientId(p.id)
                        setPatientSearch(`${p.last_name}${p.first_name}`)
                      }}
                    >
                      {p.last_name}{p.first_name} - {p.phone}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>服务类型</Label>
              <Select
                value={newAptServiceType}
                onValueChange={(v) => setNewAptServiceType(v as ServiceType)}
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
                  value={newAptDate}
                  onChange={(e) => setNewAptDate(e.target.value)}
                  className="min-w-0 flex-1"
                />
                <TimeSlotPicker
                  date={newAptDate}
                  time={newAptStartTime}
                  onDateChange={setNewAptDate}
                  onTimeChange={(t) => {
                    setNewAptStartTime(t)
                    const [h, m] = t.split(':').map(Number)
                    setNewAptEndTime(`${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={newAptStartTime}
                  onChange={(e) => setNewAptStartTime(e.target.value)}
                  className="min-w-0 flex-1"
                />
                <span className="text-muted-foreground text-sm shrink-0">-</span>
                <Input
                  type="time"
                  value={newAptEndTime}
                  onChange={(e) => setNewAptEndTime(e.target.value)}
                  className="min-w-0 flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={newAptNotes}
                onChange={(e) => setNewAptNotes(e.target.value)}
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
              disabled={!newAptPatientId || createAppointment.isPending}
            >
              {createAppointment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              创建预约
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Time Dialog */}
      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>屏蔽时间段</DialogTitle>
            <DialogDescription>此时间段将不可预约</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>日期</Label>
              <Input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input
                  type="time"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <Input
                  type="time"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>原因</Label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="午休、会议等..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button
              onClick={() => createBlockedTime.mutate()}
              disabled={createBlockedTime.isPending}
            >
              确认屏蔽
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Appointment Dialog */}
      <Dialog open={!!viewAptDialog} onOpenChange={(open) => {
        if (!open) {
          setViewAptDialog(null)
          setRescheduleMode(false)
        }
      }}>
        <DialogContent className="max-w-sm">
          {viewAptDialog && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {viewAptDialog.patient
                    ? `${viewAptDialog.patient.last_name}${viewAptDialog.patient.first_name}`
                    : '预约详情'}
                </DialogTitle>
                <DialogDescription>预约信息</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatTime(viewAptDialog.start_time)} - {formatTime(viewAptDialog.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', SERVICE_TYPE_COLORS[viewAptDialog.service_type])}
                  >
                    {SERVICE_TYPE_LABELS[viewAptDialog.service_type]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', STATUS_COLORS[viewAptDialog.status])}
                  >
                    {STATUS_LABELS[viewAptDialog.status]}
                  </Badge>
                </div>
                {viewAptDialog.patient?.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      电话: {viewAptDialog.patient.phone}
                    </span>
                    <a
                      href={`tel:${viewAptDialog.patient.phone}`}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
                {viewAptDialog.notes && (
                  <p className="text-sm text-muted-foreground">备注: {viewAptDialog.notes}</p>
                )}

                {/* Reschedule form */}
                {rescheduleMode && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-2">
                      <Label>新日期与时间</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="min-w-0 flex-1"
                        />
                        <Input
                          type="time"
                          value={rescheduleTime}
                          onChange={(e) => setRescheduleTime(e.target.value)}
                          className="min-w-0 flex-1"
                        />
                        <TimeSlotPicker
                          date={rescheduleDate}
                          time={rescheduleTime}
                          onDateChange={setRescheduleDate}
                          onTimeChange={setRescheduleTime}
                          excludeAppointmentId={viewAptDialog.id}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setRescheduleMode(false)}
                      >
                        取消
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!rescheduleDate || !rescheduleTime || rescheduleAppointment.isPending}
                        onClick={() => rescheduleAppointment.mutate({
                          id: viewAptDialog.id,
                          startTime: `${rescheduleDate}T${rescheduleTime}`,
                        })}
                      >
                        {rescheduleAppointment.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        确认改期
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {!rescheduleMode && (
                <DialogFooter className="flex-row gap-2 sm:justify-between">
                  {viewAptDialog.status !== 'cancelled' && viewAptDialog.status !== 'completed' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelAppointment.mutate(viewAptDialog.id)}
                        disabled={cancelAppointment.isPending}
                      >
                        取消预约
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const start = parseISO(viewAptDialog.start_time)
                          setRescheduleDate(format(start, 'yyyy-MM-dd'))
                          setRescheduleTime(format(start, 'HH:mm'))
                          setRescheduleMode(true)
                        }}
                      >
                        改期
                      </Button>
                    </div>
                  )}
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">关闭</Button>
                  </DialogClose>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
