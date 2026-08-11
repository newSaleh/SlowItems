// ترتيب: حسب المورد تصاعديًا، ثم داخل كل مورد حسب البيان (الصنف) تنازليًا، ثم حسب الرصيد تصاعديًا
const collator = new Intl.Collator('ar')

export function sortItems(items) {
  return [...items].sort((a, b) => {
    const bySupplier = collator.compare(a.supplier_code, b.supplier_code)
    if (bySupplier !== 0) return bySupplier
    const byCategory = collator.compare(a.category, b.category)
    if (byCategory !== 0) return -byCategory // تنازلي
    return a.balance - b.balance
  })
}
