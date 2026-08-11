const collator = new Intl.Collator('ar')

// حسب المورد: المورد تصاعديًا، ثم داخل كل مورد البيان (الصنف) تنازليًا، ثم الرصيد تصاعديًا
export function sortBySupplier(items) {
  return [...items].sort((a, b) => {
    const bySupplier = collator.compare(a.supplier_code, b.supplier_code)
    if (bySupplier !== 0) return bySupplier
    const byCategory = collator.compare(a.category, b.category)
    if (byCategory !== 0) return -byCategory // تنازلي
    return a.balance - b.balance
  })
}

// حسب البيان: البيان تصاعديًا، ثم داخل كل بيان رقم المورد تصاعديًا، ثم الرصيد تنازليًا
export function sortByCategory(items) {
  return [...items].sort((a, b) => {
    const byCategory = collator.compare(a.category, b.category)
    if (byCategory !== 0) return byCategory
    const bySupplier = collator.compare(a.supplier_code, b.supplier_code)
    if (bySupplier !== 0) return bySupplier
    return b.balance - a.balance // تنازلي
  })
}

export function sortItems(items, groupBy = 'supplier') {
  return groupBy === 'category' ? sortByCategory(items) : sortBySupplier(items)
}
