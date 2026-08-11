import { Router } from 'express'
import multer from 'multer'
import ExcelJS from 'exceljs'
import { db } from '../db.js'
import { sortItems } from '../sort.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

const HEADER_MAP = {
  'رمز المورد': 'supplier_code',
  'اسم المورد': 'supplier_name',
  'اسم مجموعة المخزون': 'category',
  'الموديل': 'model',
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

function getMeta(key) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key)
  return row?.value ?? null
}

function setMeta(key, value) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
}

// GET /api/items - list all items + meta
router.get('/', (req, res) => {
  const items = sortItems(db.prepare('SELECT * FROM items').all())
  res.json({
    items,
    meta: {
      branchName: getMeta('branch_name'),
      importedAt: getMeta('imported_at'),
      sourceFile: getMeta('source_file'),
    },
  })
})

// POST /api/items - create a new item
router.post('/', (req, res) => {
  const { supplier_code, supplier_name, category, model, balance, price } = req.body
  if (!supplier_code || !supplier_name) {
    return res.status(400).json({ error: 'رمز المورد واسم المورد مطلوبان' })
  }
  const stmt = db.prepare(`
    INSERT INTO items (supplier_code, supplier_name, category, model, balance, price, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `)
  const info = stmt.run(
    String(supplier_code).trim(),
    String(supplier_name).trim(),
    String(category ?? '').trim(),
    String(model ?? '').trim(),
    toNumber(balance),
    toNumber(price)
  )
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json(item)
})

// PUT /api/items/:id - update an item
router.put('/:id', (req, res) => {
  const { id } = req.params
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'الصنف غير موجود' })

  const { supplier_code, supplier_name, category, model, balance, price } = req.body
  const stmt = db.prepare(`
    UPDATE items SET
      supplier_code = ?, supplier_name = ?, category = ?, model = ?, balance = ?, price = ?, updated_at = datetime('now')
    WHERE id = ?
  `)
  stmt.run(
    String(supplier_code ?? existing.supplier_code).trim(),
    String(supplier_name ?? existing.supplier_name).trim(),
    String(category ?? existing.category).trim(),
    String(model ?? existing.model).trim(),
    balance !== undefined ? toNumber(balance) : existing.balance,
    price !== undefined ? toNumber(price) : existing.price,
    id
  )
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id)
  res.json(item)
})

// DELETE /api/items/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params
  const info = db.prepare('DELETE FROM items WHERE id = ?').run(id)
  if (info.changes === 0) return res.status(404).json({ error: 'الصنف غير موجود' })
  res.status(204).end()
})

// POST /api/items/import - upload xlsx, replace current dataset
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم إرفاق ملف' })

  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(req.file.buffer)
    const sheet = workbook.worksheets[0]
    if (!sheet) return res.status(400).json({ error: 'الملف لا يحتوي على أي ورقة عمل' })

    const headerRow = sheet.getRow(1)
    const colIndexByField = {}
    headerRow.eachCell((cell, colNumber) => {
      const header = normalizeHeader(cell.value)
      const field = HEADER_MAP[header]
      if (field) colIndexByField[field] = colNumber
    })

    const requiredFields = Object.values(HEADER_MAP)
    const missing = requiredFields.filter((f) => !colIndexByField[f])
    if (missing.length) {
      const missingHeaders = Object.entries(HEADER_MAP)
        .filter(([, field]) => missing.includes(field))
        .map(([header]) => header)
      return res.status(400).json({
        error: `تعذر العثور على الأعمدة التالية في الملف: ${missingHeaders.join('، ')}`,
      })
    }

    const rows = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const cellVal = (field) => {
        const cell = row.getCell(colIndexByField[field])
        const v = cell.value
        if (v && typeof v === 'object' && 'result' in v) return v.result
        if (v && typeof v === 'object' && 'text' in v) return v.text
        return v
      }
      const supplier_code = normalizeHeader(cellVal('supplier_code'))
      const supplier_name = normalizeHeader(cellVal('supplier_name'))
      if (!supplier_code && !supplier_name) return // skip blank rows
      rows.push({
        supplier_code,
        supplier_name,
        category: normalizeHeader(cellVal('category')),
        model: normalizeHeader(cellVal('model')),
        balance: toNumber(cellVal('balance')),
        price: toNumber(cellVal('price')),
      })
    })

    if (!rows.length) {
      return res.status(400).json({ error: 'لم يتم العثور على أي بيانات صالحة في الملف' })
    }

    const insertMany = db.transaction((items) => {
      db.prepare('DELETE FROM items').run()
      const stmt = db.prepare(`
        INSERT INTO items (supplier_code, supplier_name, category, model, balance, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      for (const it of items) {
        stmt.run(it.supplier_code, it.supplier_name, it.category, it.model, it.balance, it.price)
      }
    })
    insertMany(rows)

    setMeta('imported_at', new Date().toISOString())
    setMeta('source_file', req.file.originalname)

    res.json({ imported: rows.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'حدث خطأ أثناء قراءة ملف الإكسل' })
  }
})

// POST /api/items/branch - set branch name label used for print/export headers
router.post('/branch', (req, res) => {
  const { branchName } = req.body
  setMeta('branch_name', String(branchName ?? '').trim())
  res.json({ branchName: getMeta('branch_name') })
})

// GET /api/items/export - grouped-by-supplier xlsx, one table per supplier
router.get('/export', async (req, res) => {
  const { branchName = '', dateFrom = '', dateTo = '' } = req.query
  const items = db.prepare('SELECT * FROM items').all()
  const sorted = sortItems(items)

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('تقرير الموردين', { views: [{ rightToLeft: true }] })
  sheet.columns = [
    { width: 14 }, { width: 30 }, { width: 22 }, { width: 16 }, { width: 12 }, { width: 12 },
  ]

  const titleFont = { name: 'Arial', size: 14, bold: true }
  const headerFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
  const bodyFont = { name: 'Arial', size: 11 }
  const thinBorder = { style: 'thin', color: { argb: 'FFCBD5E1' } }
  const borderAll = { top: thinBorder, left: thinBorder, right: thinBorder, bottom: thinBorder }

  let cursor = 1
  if (branchName || dateFrom || dateTo) {
    const infoParts = []
    if (branchName) infoParts.push(`الفرع: ${branchName}`)
    if (dateFrom || dateTo) infoParts.push(`الفترة: من ${dateFrom || '—'} إلى ${dateTo || '—'}`)
    const infoRow = sheet.getRow(cursor)
    infoRow.getCell(1).value = infoParts.join('      ')
    infoRow.getCell(1).font = { name: 'Arial', size: 12, bold: true }
    sheet.mergeCells(cursor, 1, cursor, 6)
    cursor += 2
  }

  const bySupplier = new Map()
  for (const it of sorted) {
    if (!bySupplier.has(it.supplier_code)) bySupplier.set(it.supplier_code, [])
    bySupplier.get(it.supplier_code).push(it)
  }

  for (const [supplierCode, supplierItems] of bySupplier) {
    const supplierName = supplierItems[0].supplier_name

    const titleRow = sheet.getRow(cursor)
    titleRow.getCell(1).value = `${supplierCode} - ${supplierName}`
    titleRow.getCell(1).font = titleFont
    sheet.mergeCells(cursor, 1, cursor, 6)
    cursor += 1

    const headerRow = sheet.getRow(cursor)
    const headers = ['المورد', 'الاسم', 'البيان', 'موديل', 'الرصيد', 'السعر']
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h
      cell.font = headerFont
      cell.fill = headerFill
      cell.border = borderAll
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    cursor += 1

    for (const it of supplierItems) {
      const row = sheet.getRow(cursor)
      const values = [it.supplier_code, it.supplier_name, it.category, it.model, it.balance, it.price]
      values.forEach((v, i) => {
        const cell = row.getCell(i + 1)
        cell.value = v
        cell.font = bodyFont
        cell.border = borderAll
        cell.alignment = { horizontal: i >= 4 ? 'center' : 'right', vertical: 'middle' }
      })
      cursor += 1
    }

    cursor += 2 // small gap between supplier tables
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="suppliers-report.xlsx"')
  await workbook.xlsx.write(res)
  res.end()
})

export default router
