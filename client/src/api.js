import { loadItems, saveItems, loadMeta, saveMeta, nextId } from './storage.js'
import { sortItems } from './sort.js'
import { parseSuppliersFile, downloadSuppliersExport } from './excel.js'

function nowISO() {
  return new Date().toISOString()
}

function apiError(message) {
  const err = new Error(message)
  err.response = { data: { error: message } }
  return err
}

export const ItemsAPI = {
  async list() {
    return { items: sortItems(loadItems()), meta: loadMeta() }
  },

  async create(values) {
    const supplier_code = String(values.supplier_code ?? '').trim()
    const supplier_name = String(values.supplier_name ?? '').trim()
    if (!supplier_code || !supplier_name) throw apiError('رمز المورد واسم المورد مطلوبان')

    const item = {
      id: nextId(),
      supplier_code,
      supplier_name,
      category: String(values.category ?? '').trim(),
      model: String(values.model ?? '').trim(),
      balance: Number(values.balance) || 0,
      price: Number(values.price) || 0,
      created_at: nowISO(),
      updated_at: nowISO(),
    }
    const items = loadItems()
    items.push(item)
    saveItems(items)
    return item
  },

  async update(id, values) {
    const items = loadItems()
    const idx = items.findIndex((i) => i.id === id)
    if (idx === -1) throw apiError('الصنف غير موجود')

    const existing = items[idx]
    const updated = {
      ...existing,
      supplier_code: values.supplier_code !== undefined ? String(values.supplier_code).trim() : existing.supplier_code,
      supplier_name: values.supplier_name !== undefined ? String(values.supplier_name).trim() : existing.supplier_name,
      category: values.category !== undefined ? String(values.category).trim() : existing.category,
      model: values.model !== undefined ? String(values.model).trim() : existing.model,
      balance: values.balance !== undefined ? Number(values.balance) || 0 : existing.balance,
      price: values.price !== undefined ? Number(values.price) || 0 : existing.price,
      updated_at: nowISO(),
    }
    items[idx] = updated
    saveItems(items)
    return updated
  },

  async remove(id) {
    saveItems(loadItems().filter((i) => i.id !== id))
  },

  // يحذف جميع الأصناف ويعيد بيانات الفرع (اسمه وتاريخ آخر استيراد) إلى حالتها الافتراضية
  async clearAll() {
    saveItems([])
    saveMeta({ branchName: '', importedAt: null, sourceFile: null })
  },

  // يستبدل بيانات الفرع الحالي بالكامل بمحتوى الملف المرفوع (كل فرع يُستورد له ملفه الخاص بشكل منفصل)
  async import(file) {
    let parsed
    try {
      parsed = await parseSuppliersFile(file)
    } catch (err) {
      throw apiError(err.message || 'تعذر قراءة ملف الإكسل')
    }
    const items = parsed.items.map((it) => ({ id: nextId(), ...it, created_at: nowISO(), updated_at: nowISO() }))
    saveItems(items)
    saveMeta({ ...loadMeta(), importedAt: nowISO(), sourceFile: file.name })
    return { imported: items.length, duplicatesRemoved: parsed.duplicatesRemoved }
  },

  async setBranch(branchName) {
    const meta = { ...loadMeta(), branchName: String(branchName ?? '').trim() }
    saveMeta(meta)
    return meta
  },

  // يولّد ملف إكسل مقسّم حسب المورد أو البيان ويبدأ تنزيله مباشرة من المتصفح
  export({ title = '', branchName = '', dateFrom = '', dateTo = '', groupBy = 'supplier' } = {}) {
    downloadSuppliersExport(loadItems(), { title, branchName, dateFrom, dateTo, groupBy })
  },
}
