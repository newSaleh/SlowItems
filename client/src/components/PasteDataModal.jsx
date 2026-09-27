import { useState } from 'react'

export default function PasteDataModal({ open, onClose, onSubmit }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleClose = () => {
    setText('')
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('الرجاء لصق البيانات أولاً')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit(text)
      handleClose()
    } catch (err) {
      setError(err?.response?.data?.error || 'تعذر قراءة البيانات الملصقة')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">لصق البيانات</h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-slate-500">
            حدد نطاق الخلايا في إكسل بما في ذلك صف العناوين (Ctrl+C)، ثم الصقه هنا (Ctrl+V).
          </p>
          <textarea
            className="input h-64 font-mono text-xs resize-none"
            dir="ltr"
            placeholder="الصق البيانات هنا..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div className="mx-6 mb-3 rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2">{error}</div>
        )}

        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-2">
          <button onClick={handleClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200/60">
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-600/30"
          >
            {saving ? 'جارِ الاستيراد...' : 'استيراد'}
          </button>
        </div>
      </div>
    </div>
  )
}
