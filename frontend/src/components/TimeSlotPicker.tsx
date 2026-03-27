import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  format,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  parseISO,
  differenceInMinutes,
  isToday,
  isBefore,
  startOfWeek,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { isDemoMode, DEMO_APPOINTMENTS } from '@/lib/demo-data'
import type { Appointment, BlockedTime } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const WORK_START = 8
const WORK_END = 20
const SLOT_MINUTES = 30
const SLOTS = Array.from(
  { length: ((WORK_END - WORK_START) * 60) / SLOT_MINUTES },
  (_, i) => {
    const totalMin = WORK_START * 60 + i * SLOT_MINUTES
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return {
      hour: h,
      minute: m,
      label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    }
  }
)

interface TimeSlotPickerProps {
  date: string // yyyy-MM-dd
  time: string // HH:mm
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  /** Appointment ID to exclude from "occupied" display (for reschedule) */
  excludeAppointmentId?: string
}

export function TimeSlotPicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  excludeAppointmentId,
}: TimeSlotPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={() => setOpen(true)}
      >
        <CalendarDays className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-0 gap-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>选择时间</DialogTitle>
            <DialogDescription>绿色为空闲时段，灰色为已占用</DialogDescription>
          </DialogHeader>
          <TimeSlotPickerContent
            date={date}
            time={time}
            onDateChange={onDateChange}
            onTimeChange={(t) => {
              onTimeChange(t)
              setOpen(false)
            }}
            excludeAppointmentId={excludeAppointmentId}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function TimeSlotPickerContent({
  date,
  time,
  onDateChange,
  onTimeChange,
  excludeAppointmentId,
}: TimeSlotPickerProps) {
  const selectedDate = date ? new Date(date + 'T00:00:00') : new Date()

  // Mini week view: show 7 days starting from Monday of selected week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const navigateWeek = (dir: number) => {
    const newDate = dir > 0 ? addDays(selectedDate, 7) : subDays(selectedDate, 7)
    onDateChange(format(newDate, 'yyyy-MM-dd'))
  }

  // Fetch appointments for selected date
  const dayStart = startOfDay(selectedDate).toISOString()
  const dayEnd = endOfDay(selectedDate).toISOString()

  const { data: appointments = [] } = useQuery({
    queryKey: ['timeslot-appointments', dayStart, dayEnd],
    queryFn: async () => {
      if (isDemoMode) {
        return DEMO_APPOINTMENTS.filter((a) => {
          const t = new Date(a.start_time)
          return t >= new Date(dayStart) && t <= new Date(dayEnd) && a.status !== 'cancelled'
        })
      }
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .neq('status', 'cancelled')
        .order('start_time')
      if (error) throw error
      return data as Appointment[]
    },
  })

  const { data: blockedTimes = [] } = useQuery({
    queryKey: ['timeslot-blocked', dayStart, dayEnd],
    queryFn: async () => {
      if (isDemoMode) return [] as BlockedTime[]
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*')
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .order('start_time')
      if (error) throw error
      return data as BlockedTime[]
    },
  })

  // Build occupied ranges (in minutes from midnight)
  const occupiedRanges = useMemo(() => {
    const ranges: Array<{ start: number; end: number; label: string }> = []

    for (const apt of appointments) {
      if (excludeAppointmentId && apt.id === excludeAppointmentId) continue
      const s = parseISO(apt.start_time)
      const e = parseISO(apt.end_time)
      const patientName = apt.patient
        ? `${apt.patient.last_name}${apt.patient.first_name}`
        : ''
      ranges.push({
        start: s.getHours() * 60 + s.getMinutes(),
        end: e.getHours() * 60 + e.getMinutes(),
        label: patientName,
      })
    }

    for (const bt of blockedTimes) {
      const s = parseISO(bt.start_time)
      const e = parseISO(bt.end_time)
      ranges.push({
        start: s.getHours() * 60 + s.getMinutes(),
        end: e.getHours() * 60 + e.getMinutes(),
        label: bt.reason || '已屏蔽',
      })
    }

    return ranges
  }, [appointments, blockedTimes, excludeAppointmentId])

  const isSlotOccupied = (slotMinute: number) => {
    return occupiedRanges.some(
      (r) => slotMinute >= r.start && slotMinute < r.end
    )
  }

  const getSlotLabel = (slotMinute: number) => {
    const range = occupiedRanges.find(
      (r) => slotMinute >= r.start && slotMinute < r.end
    )
    return range?.label
  }

  return (
    <div className="flex flex-col">
      {/* Week date selector */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(weekStart, 'M月', { locale: zhCN })}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-3 py-2 border-b">
        {weekDays.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const isSelected = dayStr === date
          const isPast = isBefore(day, startOfDay(new Date())) && !isToday(day)
          return (
            <button
              key={dayStr}
              type="button"
              disabled={isPast}
              className={cn(
                'flex flex-col items-center py-1.5 rounded-lg text-xs transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isPast
                    ? 'text-muted-foreground/40'
                    : 'hover:bg-muted',
                isToday(day) && !isSelected && 'ring-1 ring-primary'
              )}
              onClick={() => onDateChange(dayStr)}
            >
              <span className="text-[10px]">{format(day, 'EEE', { locale: zhCN })}</span>
              <span className="font-medium">{format(day, 'd')}</span>
            </button>
          )
        })}
      </div>

      {/* Time slots */}
      <div className="max-h-[50vh] overflow-y-auto px-3 py-2">
        <div className="grid grid-cols-2 gap-1.5">
          {SLOTS.map((slot) => {
            const slotMin = slot.hour * 60 + slot.minute
            const occupied = isSlotOccupied(slotMin)
            const label = getSlotLabel(slotMin)
            const isSelected = time === slot.label
            return (
              <button
                key={slot.label}
                type="button"
                disabled={occupied}
                className={cn(
                  'relative px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : occupied
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200/60'
                )}
                onClick={() => !occupied && onTimeChange(slot.label)}
              >
                {slot.label}
                {occupied && label && (
                  <span className="block text-[10px] font-normal truncate opacity-70">
                    {label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
