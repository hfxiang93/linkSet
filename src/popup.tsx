import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const c = (globalThis as any).chrome
    if (!c?.tabs?.query) return
    c.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const t = tabs && tabs[0]
      if (t) {
        setTitle(t.title || '')
        setUrl(t.url || '')
      }
    })
  }, [])

  function add() {
    if (!/^https?:/i.test(url)) {
      alert('当前页不是 http/https 链接')
      return
    }
    const c = (globalThis as any).chrome
    const item = {
      id: (self.crypto && self.crypto.randomUUID) ? self.crypto.randomUUID() : String(Date.now()),
      name: title || url,
      url,
      path: []
    }
    c.storage.local.get('linkset:inbox', (res: any) => {
      const inbox = Array.isArray(res['linkset:inbox']) ? res['linkset:inbox'] : []
      inbox.push(item)
      c.storage.local.set({ 'linkset:inbox': inbox }, () => setDone(true))
    })
  }

  return (
    <div style={{ padding: 12, minWidth: 320 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>添加到 LinkSet</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="名称" />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="地址" />
        <button onClick={add} disabled={done} style={{ padding: '8px 12px' }}>
          {done ? '已添加' : '添加'}
        </button>
      </div>
    </div>
  )
}

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
