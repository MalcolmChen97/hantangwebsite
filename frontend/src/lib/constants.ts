export const SERVICE_TYPE_LABELS: Record<string, string> = {
  acupuncture: '针灸',
  herbal_consultation: '中药复诊',
  initial_consultation: '初诊',
  follow_up: '复诊',
  other: '其他',
}

export const SERVICE_TYPE_COLORS: Record<string, string> = {
  acupuncture: 'bg-accent/20 text-accent-foreground border-accent/30',
  herbal_consultation: 'bg-secondary/20 text-secondary border-secondary/30',
  initial_consultation: 'bg-primary/20 text-primary border-primary/30',
  follow_up: 'bg-muted text-muted-foreground border-border',
  other: 'bg-muted text-muted-foreground border-border',
}

export const STATUS_LABELS: Record<string, string> = {
  scheduled: '已预约',
  confirmed: '已确认',
  arrived: '已到店',
  in_progress: '就诊中',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '未到',
}

export const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-primary/15 text-primary border-primary/25',
  arrived: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-accent/20 text-accent-foreground border-accent/30',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  no_show: 'bg-destructive/15 text-destructive border-destructive/25',
}

export const TREATMENT_TYPE_LABELS: Record<string, string> = {
  acupuncture: '针灸',
  herbal: '中药',
  acupuncture_and_herbal: '针灸 + 中药',
  consultation: '问诊',
  other: '其他',
}

export const GENDER_LABELS: Record<string, string> = {
  male: '男',
  female: '女',
  other: '其他',
  prefer_not_to_say: '不愿透露',
}
