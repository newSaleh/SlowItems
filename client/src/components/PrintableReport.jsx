import { sortItems } from '../sort.js'

function groupItems(items, groupBy) {
  const map = new Map()
  const keyOf = (it) => (groupBy === 'category' ? it.category : it.supplier_code)
  for (const it of items) {
    const key = keyOf(it)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(it)
  }
  return [...map.entries()]
}

export default function PrintableReport({ items, branchName, dateFrom, dateTo, groupBy = 'supplier' }) {
  const sorted = sortItems(items, groupBy)
  const groups = groupItems(sorted, groupBy)

  return (
    <div className="hidden print:block p-6 bg-white text-black" dir="rtl">
      <div className="mb-4 border-b-2 border-black pb-3">
        <h1 className="text-xl font-bold">مخزون البضاعة الراكدة</h1>
        <div className="flex gap-8 text-sm mt-1">
          {branchName && <span>الفرع: <strong>{branchName}</strong></span>}
          {(dateFrom || dateTo) && (
            <span>
              الفترة: من <strong>{dateFrom || '—'}</strong> إلى <strong>{dateTo || '—'}</strong>
            </span>
          )}
        </div>
      </div>

      {groups.map(([key, rows], idx) => (
        <div key={key} className={idx > 0 ? 'mt-3 pt-3 border-t border-dashed border-black' : ''}>
          <div className="text-[13px] font-bold mb-1">
            {groupBy === 'category' ? rows[0].category : `${rows[0].supplier_code} - ${rows[0].supplier_name}`}
          </div>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="font-bold">
                {groupBy === 'category' ? (
                  <>
                    <th className="border-2 border-black px-2 py-1">المورد</th>
                    <th className="border-2 border-black px-2 py-1">الاسم</th>
                  </>
                ) : (
                  <th className="border-2 border-black px-2 py-1">البيان</th>
                )}
                <th className="border-2 border-black px-2 py-1">موديل</th>
                <th className="border-2 border-black px-2 py-1">الرصيد</th>
                <th className="border-2 border-black px-2 py-1">السعر</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {groupBy === 'category' ? (
                    <>
                      <td className="border border-black px-2 py-0.5 text-center">{r.supplier_code}</td>
                      <td className="border border-black px-2 py-0.5">{r.supplier_name}</td>
                    </>
                  ) : (
                    <td className="border border-black px-2 py-0.5">{r.category}</td>
                  )}
                  <td className="border border-black px-2 py-0.5 text-center">{r.model}</td>
                  <td className="border border-black px-2 py-0.5 text-center">{r.balance}</td>
                  <td className="border border-black px-2 py-0.5 text-center">{r.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
