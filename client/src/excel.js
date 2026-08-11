import * as XLSX from 'xlsx'
import { sortItems } from './sort.js'

const HEADER_MAP = {
  'رمز المورد': 'supplier_code',
  'اسم المورد': 'supplier_name',
  'اسم مجموعة المخزون': 'category',
  الموديل: 'model',
  'الرصيد الحالي': 'balance',
  'السعر الحالي': 'price',
}

function normalizeHeader(h) {
  return String(h ?? '').trim()
}

function toNumber(v) {
  if (v === null || v === undefined || v === '') return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

// يقرأ ملف إكسل الموردين ويحوّله إلى مصفوفة أصناف مطابقة لحقول التطبيق
export async function parseSuppliersFile(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('الملف لا يحتوي على أي ورقة عمل')
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' })
  if (!rows.length) throw new Error('الملف فارغ')

  const headerRow = rows[0]
  const colIndexByField = {}
  headerRow.forEach((cell, idx) => {
    const header = normalizeHeader(cell)
    const field = HEADER_MAP[header]
    if (field) colIndexByField[field] = idx
  })

  const requiredFields = Object.values(HEADER_MAP)
  const missing = requiredFields.filter((f) => !(f in colIndexByField))
  if (missing.length) {
    const missingHeaders = Object.entries(HEADER_MAP)
      .filter(([, field]) => missing.includes(field))
      .map(([header]) => header)
    throw new Error(`تعذر العثور على الأعمدة التالية في الملف: ${missingHeaders.join('، ')}`)
  }

  const items = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const cell = (field) => row[colIndexByField[field]]
    const supplier_code = normalizeHeader(cell('supplier_code'))
    const supplier_name = normalizeHeader(cell('supplier_name'))
    if (!supplier_code && !supplier_name) continue
    items.push({
      supplier_code,
      supplier_name,
      category: normalizeHeader(cell('category')),
      model: normalizeHeader(cell('model')),
      balance: toNumber(cell('balance')),
      price: toNumber(cell('price')),
    })
  }

  if (!items.length) throw new Error('لم يتم العثور على أي بيانات صالحة في الملف')

  const { items: deduped, duplicatesRemoved } = dedupeItems(items)
  if (!deduped.length) throw new Error('لم يتم العثور على أي بيانات صالحة في الملف')
  return { items: deduped, duplicatesRemoved }
}

// يحذف الأسطر المكررة تمامًا (نفس المورد والبيان والموديل والرصيد والسعر)، ويبقي على أول ظهور فقط
function dedupeItems(items) {
  const seen = new Set()
  const result = []
  let duplicatesRemoved = 0
  for (const it of items) {
    const key = [it.supplier_code, it.category, it.model, it.balance, it.price].join(' ')
    if (seen.has(key)) {
      duplicatesRemoved++
      continue
    }
    seen.add(key)
    result.push(it)
  }
  return { items: result, duplicatesRemoved }
}

// يبني ملف إكسل: جدول منفصل لكل مجموعة (مورد أو بيان حسب groupBy) يفصله سطر فارغ
export function downloadSuppliersExport(items, { branchName = '', dateFrom = '', dateTo = '', groupBy = 'supplier' } = {}) {
  const sorted = sortItems(items, groupBy)
  const headers = ['المورد', 'الاسم', 'البيان', 'موديل', 'الرصيد', 'السعر']
  const aoa = []
  const merges = []

  if (branchName || dateFrom || dateTo) {
    const parts = []
    if (branchName) parts.push(`الفرع: ${branchName}`)
    if (dateFrom || dateTo) parts.push(`الفترة: من ${dateFrom || '—'} إلى ${dateTo || '—'}`)
    aoa.push([parts.join('      ')])
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } })
    aoa.push([])
  }

  const groupKey = (it) => (groupBy === 'category' ? it.category : it.supplier_code)
  const groupTitle = (groupItems) =>
    groupBy === 'category' ? groupItems[0].category : `${groupItems[0].supplier_code} - ${groupItems[0].supplier_name}`

  const groups = new Map()
  for (const it of sorted) {
    const key = groupKey(it)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(it)
  }

  for (const groupItems of groups.values()) {
    const titleRowIndex = aoa.length
    aoa.push([groupTitle(groupItems)])
    merges.push({ s: { r: titleRowIndex, c: 0 }, e: { r: titleRowIndex, c: 5 } })
    aoa.push(headers)
    for (const it of groupItems) {
      aoa.push([it.supplier_code, it.supplier_name, it.category, it.model, it.balance, it.price])
    }
    aoa.push([])
    aoa.push([])
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 12 }]
  ws['!merges'] = merges

  const wb = XLSX.utils.book_new()
  wb.Workbook = { Views: [{ RTL: true }] }
  XLSX.utils.book_append_sheet(wb, ws, 'تقرير الموردين')
  XLSX.writeFile(wb, 'suppliers-report.xlsx')
}
