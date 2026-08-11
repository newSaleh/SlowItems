import { useEffect, useMemo, useRef, useState } from 'react'
import { ItemsAPI } from '../api.js'
import ItemFormModal from '../components/ItemFormModal.jsx'
import PrintModal from '../components/PrintModal.jsx'
import PrintableReport from '../components/PrintableReport.jsx'

function fmtNumber(n) {
  return new Intl.NumberFormat('ar-EG-u-nu-latn').format(n)
}

export default function SuppliersInventoryPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const [printModal, setPrintModal] = useState({ open: false, mode: 'print' })
  const [printState, setPrintState] = useState(null)

  const [importing, setImporting] = useState(false)
  const [toast, setToast] = useState('')
  const fileInputRef = useRef(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ItemsAPI.list()
      setItems(data.items)
      setMeta(data.meta)
    } catch {
      setError('تعذر تحميل البيانات من الخادم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) return items
    return items.filter(
      (it) =>
        it.supplier_code.includes(q) ||
        it.supplier_name.includes(q) ||
        it.category.includes(q) ||
        it.model.includes(q)
    )
  }, [items, search])

  const stats = useMemo(() => {
    const suppliers = new Set(items.map((i) => i.supplier_code))
    const totalValue = items.reduce((s, i) => s + i.balance * i.price, 0)
    const totalBalance = items.reduce((s, i) => s + i.balance, 0)
    return { suppliersCount: suppliers.size, itemsCount: items.length, totalValue, totalBalance }
  }, [items])

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    setError('')
    try {
      const res = await ItemsAPI.import(file)
      await load()
      showToast(`تم استيراد ${fmtNumber(res.imported)} صنف بنجاح`)
    } catch (err) {
      setError(err?.response?.data?.error || 'تعذر استيراد الملف')
    } finally {
      setImporting(false)
    }
  }

  const openAddForm = () => {
    setEditingItem(null)
    setFormOpen(true)
  }
  const openEditForm = (item) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleFormSubmit = async (values) => {
    if (editingItem) {
      await ItemsAPI.update(editingItem.id, values)
      showToast('تم حفظ التعديلات')
    } else {
      await ItemsAPI.create(values)
      showToast('تمت إضافة الصنف')
    }
    await load()
  }

  const handleDelete = async (item) => {
    if (!confirm(`هل أنت متأكد من حذف الصنف "${item.model}" للمورد ${item.supplier_name}؟`)) return
    await ItemsAPI.remove(item.id)
    await load()
    showToast('تم الحذف')
  }

  const handleClearAll = async () => {
    if (items.length === 0) return
    const confirmed = confirm(
      `هل أنت متأكد من حذف جميع البيانات؟\nسيتم حذف ${fmtNumber(items.length)} صنف نهائيًا من هذا الجهاز، ولا يمكن التراجع عن هذا الإجراء.`
    )
    if (!confirmed) return
    await ItemsAPI.clearAll()
    await load()
    showToast('تم حذف جميع البيانات')
  }

  const handleExportConfirm = async ({ branchName, dateFrom, dateTo }) => {
    await ItemsAPI.setBranch(branchName)
    ItemsAPI.export({ branchName, dateFrom, dateTo })
    setPrintModal({ open: false, mode: 'print' })
    showToast('تم تصدير الملف')
  }

  const handlePrintConfirm = async ({ branchName, dateFrom, dateTo }) => {
    await ItemsAPI.setBranch(branchName)
    setPrintState({ branchName, dateFrom, dateTo })
    setPrintModal({ open: false, mode: 'print' })
    setTimeout(() => window.print(), 100)
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <header className="no-print flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">البضاعة الراكدة</h2>
          <p className="text-sm text-slate-500 mt-1">
            {meta.sourceFile ? (
              <>آخر استيراد: <span className="font-medium">{meta.sourceFile}</span> — {meta.importedAt ? new Date(meta.importedAt).toLocaleString('ar-EG-u-nu-latn') : ''}</>
            ) : (
              'لم يتم استيراد أي بيانات بعد'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button onClick={handleImportClick} disabled={importing} className="btn-secondary">
            {importing ? 'جارِ الاستيراد...' : '📥 استيراد إكسل'}
          </button>
          <button onClick={() => setPrintModal({ open: true, mode: 'export' })} className="btn-secondary">
            📤 تصدير إكسل
          </button>
          <button onClick={() => setPrintModal({ open: true, mode: 'print' })} className="btn-secondary">
            🖨️ طباعة
          </button>
          <button
            onClick={handleClearAll}
            disabled={items.length === 0}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 ring-1 ring-rose-200 hover:bg-rose-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗑️ حذف الكل
          </button>
          <button onClick={openAddForm} className="btn-primary">
            + إضافة صنف
          </button>
        </div>
      </header>

      <section className="no-print grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="عدد الموردين" value={fmtNumber(stats.suppliersCount)} accent="from-indigo-500 to-indigo-600" />
        <StatCard label="عدد الأصناف" value={fmtNumber(stats.itemsCount)} accent="from-sky-500 to-sky-600" />
        <StatCard label="إجمالي الرصيد" value={fmtNumber(stats.totalBalance)} accent="from-emerald-500 to-emerald-600" />
        <StatCard label="قيمة المخزون" value={`${fmtNumber(Math.round(stats.totalValue))} ر.س`} accent="from-amber-500 to-amber-600" />
      </section>

      {error && (
        <div className="no-print mb-4 rounded-xl bg-rose-50 text-rose-700 text-sm px-4 py-3 ring-1 ring-rose-100">
          {error}
        </div>
      )}

      <div className="no-print mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث عن مورد، بيان، أو موديل..."
          className="input max-w-sm"
        />
      </div>

      <div className="no-print rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-right font-semibold">المورد</th>
                <th className="px-4 py-3 text-right font-semibold">الاسم</th>
                <th className="px-4 py-3 text-right font-semibold">البيان</th>
                <th className="px-4 py-3 text-center font-semibold">موديل</th>
                <th className="px-4 py-3 text-center font-semibold">الرصيد</th>
                <th className="px-4 py-3 text-center font-semibold">السعر</th>
                <th className="px-4 py-3 text-center font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">جارِ التحميل...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    لا توجد بيانات — قم باستيراد ملف إكسل أو إضافة صنف جديد
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-700">{it.supplier_code}</td>
                    <td className="px-4 py-2.5 text-slate-700">{it.supplier_name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{it.category}</td>
                    <td className="px-4 py-2.5 text-center text-slate-600">{it.model}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-bold ${it.balance <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {fmtNumber(it.balance)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-600">{fmtNumber(it.price)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditForm(it)} className="w-8 h-8 rounded-lg hover:bg-indigo-100 text-indigo-600 flex items-center justify-center" title="تعديل">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(it)} className="w-8 h-8 rounded-lg hover:bg-rose-100 text-rose-600 flex items-center justify-center" title="حذف">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100">
            عرض {fmtNumber(filtered.length)} من أصل {fmtNumber(items.length)} صنف
          </div>
        )}
      </div>

      <ItemFormModal open={formOpen} initial={editingItem} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} />

      <PrintModal
        open={printModal.open}
        mode={printModal.mode}
        defaultBranch={meta.branchName}
        onClose={() => setPrintModal({ open: false, mode: printModal.mode })}
        onConfirm={printModal.mode === 'export' ? handleExportConfirm : handlePrintConfirm}
      />

      {printState && <PrintableReport items={items} {...printState} />}

      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-5 py-2.5 rounded-full shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4 relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${accent}`} />
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="text-2xl font-extrabold text-slate-800 mt-1">{value}</div>
    </div>
  )
}
