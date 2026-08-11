import { useEffect, useState } from 'react'

const emptyForm = {
  supplier_code: '',
  supplier_name: '',
  category: '',
  model: '',
  balance: '',
  price: '',
}

export default function ItemFormModal({ open, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              supplier_code: initial.supplier_code ?? '',
              supplier_name: initial.supplier_name ?? '',
              category: initial.category ?? '',
              model: initial.model ?? '',
              balance: initial.balance ?? '',
              price: initial.price ?? '',
            }
          : emptyForm
      )
      setError('')
    }
  }, [open, initial])

  if (!open) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.supplier_code.trim() || !form.supplier_name.trim()) {
      setError('رمز المورد واسم المورد حقلان مطلوبان')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        ...form,
        balance: Number(form.balance) || 0,
        price: Number(form.price) || 0,
      })
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">{initial ? 'تعديل صنف' : 'إضافة صنف جديد'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <Field label="المورد (رمز المورد)">
            <input className="input" value={form.supplier_code} onChange={set('supplier_code')} />
          </Field>
          <Field label="الاسم (اسم المورد)">
            <input className="input" value={form.supplier_name} onChange={set('supplier_name')} />
          </Field>
          <Field label="البيان">
            <input className="input" value={form.category} onChange={set('category')} />
          </Field>
          <Field label="موديل">
            <input className="input" value={form.model} onChange={set('model')} />
          </Field>
          <Field label="الرصيد">
            <input type="number" step="any" className="input" value={form.balance} onChange={set('balance')} />
          </Field>
          <Field label="السعر">
            <input type="number" step="any" className="input" value={form.price} onChange={set('price')} />
          </Field>
        </div>

        {error && (
          <div className="mx-6 mb-3 rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2">{error}</div>
        )}

        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200/60"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-600/30"
          >
            {saving ? 'جارِ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  )
}
