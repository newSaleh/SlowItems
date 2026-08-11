function groupBySupplier(items) {
  const map = new Map()
  for (const it of items) {
    if (!map.has(it.supplier_code)) map.set(it.supplier_code, [])
    map.get(it.supplier_code).push(it)
  }
  return [...map.entries()]
}

export default function PrintableReport({ items, branchName, dateFrom, dateTo }) {
  const groups = groupBySupplier(items)

  return (
    <div className="hidden print:block p-6" dir="rtl">
      <div className="mb-4 border-b-2 border-slate-800 pb-3">
        <h1 className="text-xl font-extrabold">تقرير موردي المخزون</h1>
        <div className="flex gap-8 text-sm mt-1">
          {branchName && <span>الفرع: <strong>{branchName}</strong></span>}
          {(dateFrom || dateTo) && (
            <span>
              الفترة: من <strong>{dateFrom || '—'}</strong> إلى <strong>{dateTo || '—'}</strong>
            </span>
          )}
        </div>
      </div>

      {groups.map(([supplierCode, rows], idx) => (
        <div key={supplierCode} className={idx > 0 ? 'mt-3 pt-3 border-t border-dashed border-slate-400' : ''}>
          <div className="text-[13px] font-bold mb-1">
            {supplierCode} - {rows[0].supplier_name}
          </div>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="border border-slate-400 px-2 py-1">البيان</th>
                <th className="border border-slate-400 px-2 py-1">موديل</th>
                <th className="border border-slate-400 px-2 py-1">الرصيد</th>
                <th className="border border-slate-400 px-2 py-1">السعر</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="border border-slate-300 px-2 py-0.5">{r.category}</td>
                  <td className="border border-slate-300 px-2 py-0.5 text-center">{r.model}</td>
                  <td className="border border-slate-300 px-2 py-0.5 text-center">{r.balance}</td>
                  <td className="border border-slate-300 px-2 py-0.5 text-center">{r.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
