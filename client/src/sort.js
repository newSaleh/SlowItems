const collator = new Intl.Collator('ar')

// أقسام رئيسية بترتيب أولوية ثابت؛ أي بيان لا يحتوي أيًا من هذه الكلمات يذهب لقسم "أخرى" في النهاية.
// كل قسم قد يُكتشف بأكثر من كلمة (مثل "عاملة" التي تصنَّف مع النسائي)
const SECTIONS = [
  ['رجالي'],
  ['نسائي', 'عاملة'],
  ['ولادي'],
  ['بناتي'],
  ['اطفال'],
  ['مفروشات'],
]

function normalizeHamza(s) {
  return s.replace(/[أإآ]/g, 'ا')
}

function sectionRank(category) {
  const normalized = normalizeHamza(category)
  const idx = SECTIONS.findIndex((keywords) => keywords.some((kw) => normalized.includes(kw)))
  return idx === -1 ? SECTIONS.length : idx
}

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

// حسب البيان: القسم الرئيسي أولًا (رجالي، نسائي، ولادي، بناتي، أطفال، مفروشات، ثم أخرى)،
// ثم داخل كل قسم البيان أبجديًا، ثم رقم المورد تصاعديًا، ثم الرصيد تنازليًا
export function sortByCategory(items) {
  return [...items].sort((a, b) => {
    const bySection = sectionRank(a.category) - sectionRank(b.category)
    if (bySection !== 0) return bySection
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
