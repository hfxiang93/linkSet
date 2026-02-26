import { useEffect, useState } from 'react'
import type { ThemeConfig, ThemeVars } from '../theme'

type Props = {
  open: boolean
  initial: ThemeConfig
  onClose: () => void
  onSubmit: (cfg: ThemeConfig) => void
}

export default function ThemeEditor({ open, initial, onClose, onSubmit }: Props) {
  const [vars, setVars] = useState<ThemeVars>({
    bg: '',
    card: '',
    border: '',
    text: '',
    muted: '',
    accent: '',
  })

  useEffect(() => {
    setVars(initial.custom || {
      bg: '',
      card: '',
      border: '',
      text: '',
      muted: '',
      accent: '',
    })
  }, [initial, open])

  if (!open) return null

  function handleSubmit() {
    onSubmit({ mode: 'custom', custom: vars })
    onClose()
  }

  function Row({ label, keyName }: { label: string, keyName: keyof ThemeVars }) {
    return (
      <div className="form-row">
        <label>{label}</label>
        <input
          value={vars[keyName] || ''}
          onChange={(e) => setVars(v => ({ ...v, [keyName]: e.target.value }))}
          placeholder="#rrggbb 或者 css 颜色"
        />
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>自定义主题</h3>
        <Row label="背景" keyName="bg" />
        <Row label="卡片" keyName="card" />
        <Row label="边框" keyName="border" />
        <Row label="文本" keyName="text" />
        <Row label="次要文本" keyName="muted" />
        <Row label="强调色" keyName="accent" />
        <div className="modal-actions">
          <button className="button" onClick={onClose}>取消</button>
          <button className="button primary" onClick={handleSubmit}>保存</button>
        </div>
      </div>
    </div>
  )
}
