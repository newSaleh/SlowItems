import { useState } from 'react'

export default function PrintModal({ open, defaultBranch, onClose, onConfirm, mode }) {
  const [branchName, setBranchName] = useState(defaultBranch || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [groupBy, setGroupBy] = useState('supplier')

  if (!open) return null

  const titles = { export: 'تصدير التقرير', pdf: 'تصدير PDF', print: 'طباعة التقرير' }
  const ctas = { export: 'تصدير', pdf: 'تصدير PDF', print: 'طباعة' }
  const title = titles[mode] ?? titles.print
  const cta = ctas[mode] ?? ctas.print

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
          <div className="block">
            <span className="block text-xs font-semibold text-slate-500 mb-1">الترتيب والتجميع</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGroupBy('supplier')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold border transition ${
                  groupBy === 'supplier'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                حسب المورد
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('category')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold border transition ${
                  groupBy === 'category'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                حسب البيان
              </button>
            </div>
          </div>
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
          {mode === 'pdf' && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              سيفتح مربع طباعة المتصفح — اختر «حفظ كـ PDF» من قائمة الطابعة لتنزيل الملف.
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200/60">
            إلغاء
          </button>
          <button
            onClick={() => onConfirm({ branchName, dateFrom, dateTo, groupBy })}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30"
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  )
}
