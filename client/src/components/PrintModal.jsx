import { useState } from 'react'

export default function PrintModal({ open, defaultBranch, onClose, onConfirm, mode }) {
  const [branchName, setBranchName] = useState(defaultBranch || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  if (!open) return null

  const title = mode === 'export' ? 'تصدير التقرير' : 'طباعة التقرير'
  const cta = mode === 'export' ? 'تصدير' : 'طباعة'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-500 mb-1">اسم الفرع</span>
            <input className="input" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="مثال: فرع الرياض" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-500 mb-1">من تاريخ</span>
              <input
                type="date"
                className="input cursor-pointer"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-500 mb-1">إلى تاريخ</span>
              <input
                type="date"
                className="input cursor-pointer"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
              />
            </label>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200/60">
            إلغاء
          </button>
          <button
            onClick={() => onConfirm({ branchName, dateFrom, dateTo })}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30"
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  )
}
