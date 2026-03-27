import { useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import { ArrowLeft, RotateCcw, Check, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ConsentType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

const CONSENT_CONFIG: Record<
  ConsentType,
  { title: string; content: string }
> = {
  initial_consent: {
    title: '初诊知情同意书',
    content: `尊敬的患者：

欢迎您来到本中医诊所就诊。为了保障您的知情权和选择权，请您在接受诊疗前仔细阅读以下内容：

1. 诊疗说明
本诊所提供的中医诊疗服务包括但不限于：望闻问切四诊、针灸治疗、中药处方、推拿按摩、拔罐等传统中医疗法。

2. 风险告知
任何医疗行为都存在一定风险。中医治疗可能出现的不适反应包括但不限于：
- 针灸后局部酸胀、淤青
- 中药服用后轻微胃肠不适
- 拔罐后局部皮肤发红、淤斑
- 个别情况下可能出现过敏反应

3. 患者义务
- 如实告知病史、过敏史及正在使用的药物
- 如有怀孕或可能怀孕，请提前告知
- 遵医嘱按时服药、按疗程复诊
- 如出现异常反应，及时联系诊所

4. 隐私保护
本诊所将严格保护您的个人信息和医疗记录，未经您同意不会向第三方披露。

本人已阅读并理解以上内容，自愿接受本诊所的中医诊疗服务。`,
  },
  acupuncture_consent: {
    title: '针灸治疗同意书',
    content: `尊敬的患者：

您即将接受针灸治疗。为保障您的安全和知情权，请仔细阅读以下内容：

1. 治疗说明
针灸治疗通过将细针刺入特定穴位来调节身体功能。治疗可能结合以下方法：
- 毫针刺法（手法针灸）
- 电针（低频电刺激）
- 艾灸（温热疗法）
- 拔罐（负压疗法）
- 刮痧

2. 可能的风险和副作用
- 针刺部位可能出现轻微疼痛、酸胀感
- 针刺后局部可能出现小面积淤青或出血
- 极少数情况下可能出现晕针（头晕、恶心）
- 电针治疗时局部肌肉可能有跳动感
- 艾灸可能导致局部皮肤发红、轻微灼热
- 拔罐后局部会留下圆形印记，通常1-2周自行消退

3. 禁忌事项
如有以下情况，请务必告知医生：
- 有出血性疾病或正在服用抗凝血药物
- 体内安装有心脏起搏器（电针禁忌）
- 怀孕或可能怀孕
- 对金属过敏
- 有晕针史
- 空腹或过度疲劳

4. 注意事项
- 治疗后2小时内避免洗澡
- 针灸当日宜清淡饮食
- 如出现持续不适请及时联系诊所

本人已阅读并理解以上内容，同意接受针灸治疗。`,
  },
  post_treatment_confirmation: {
    title: '治疗确认',
    content: `治疗确认书

本人确认已接受今日的中医诊疗服务，并确认以下事项：

1. 医生已向本人说明今日的治疗方案和内容
2. 治疗过程中未出现严重不良反应
3. 医生已告知治疗后的注意事项
4. 本人已了解后续复诊安排和用药要求

如治疗后出现任何不适，本人将及时联系诊所。`,
  },
}

function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] ?? 'image/png'
  const bstr = atob(parts[1])
  const u8arr = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}

export default function SignaturePage() {
  const { type } = useParams<{ type: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const sigRef = useRef<SignatureCanvas>(null)

  const [isEmpty, setIsEmpty] = useState(true)

  const consentType = type as ConsentType
  const patientId = searchParams.get('patient_id')
  const visitId = searchParams.get('visit_id')

  const config = CONSENT_CONFIG[consentType]

  const saveConsent = useMutation({
    mutationFn: async () => {
      if (!sigRef.current || sigRef.current.isEmpty()) {
        throw new Error('请先签名')
      }
      if (!patientId) {
        throw new Error('缺少患者信息')
      }

      // 1. Export signature
      const dataURL = sigRef.current.toDataURL('image/png')
      const blob = dataURLtoBlob(dataURL)

      // 2. Upload to storage
      const fileName = `${patientId}_${consentType}_${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob, { contentType: 'image/png' })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(fileName)

      // 3. Create consent record
      const { error: insertError } = await supabase.from('consent_records').insert({
        patient_id: patientId,
        visit_record_id: visitId || null,
        consent_type: consentType,
        signature_url: urlData.publicUrl,
        signed_at: new Date().toISOString(),
      })
      if (insertError) throw insertError

      // 4. Update patient consent_signed flag if initial consent
      if (consentType === 'initial_consent') {
        await supabase
          .from('patients')
          .update({ consent_signed: true, updated_at: new Date().toISOString() })
          .eq('id', patientId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-consents', patientId] })
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
      toast({ title: '签署成功' })
      navigate(-1)
    },
    onError: (error) => {
      toast({ title: error.message, variant: 'destructive' })
    },
  })

  const handleClear = () => {
    sigRef.current?.clear()
    setIsEmpty(true)
  }

  if (!config) {
    return (
      <div className="text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
        <p className="text-muted-foreground">无效的同意书类型</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Consent text */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">{config.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[40vh] overflow-y-auto pr-2">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {config.content}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Signature area */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              请在下方签名
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border-2 border-dashed border-border rounded-lg bg-white overflow-hidden">
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{
                  className: 'w-full',
                  style: { width: '100%', height: '200px' },
                }}
                onBegin={() => setIsEmpty(false)}
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isEmpty}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                清除签名
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            取消
          </Button>
          <Button
            className="flex-1"
            onClick={() => saveConsent.mutate()}
            disabled={isEmpty || saveConsent.isPending}
          >
            {saveConsent.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                提交中...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                确认签署
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
