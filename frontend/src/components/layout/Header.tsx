import { useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'

const pageTitles: Record<string, string> = {
  '/': '今日日程',
  '/patients': '患者档案',
  '/calendar': '预约日历',
}

export function Header() {
  const location = useLocation()
  const { user } = useAuth()

  const getTitle = () => {
    if (location.pathname.startsWith('/patients/')) return '患者详情'
    if (location.pathname.startsWith('/visits/new')) return '新建就诊记录'
    if (location.pathname.startsWith('/visits/')) return '就诊详情'
    if (location.pathname.startsWith('/signature/')) return '签名'
    return pageTitles[location.pathname] || '中医诊所'
  }

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-12 px-6">
        <h1 className="text-sm font-medium text-foreground">{getTitle()}</h1>
        <span className="text-xs text-muted-foreground">{user?.email}</span>
      </div>
    </header>
  )
}
