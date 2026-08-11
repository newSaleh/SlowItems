const ITEMS_KEY = 'slowitems.items.v1'
const META_KEY = 'slowitems.meta.v1'
const SEQ_KEY = 'slowitems.seq.v1'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadItems() {
  return readJSON(ITEMS_KEY, [])
}

export function saveItems(items) {
  writeJSON(ITEMS_KEY, items)
}

const defaultMeta = { branchName: '', importedAt: null, sourceFile: null }

export function loadMeta() {
  return { ...defaultMeta, ...readJSON(META_KEY, {}) }
}

export function saveMeta(meta) {
  writeJSON(META_KEY, meta)
}

export function nextId() {
  const seq = readJSON(SEQ_KEY, 0) + 1
  writeJSON(SEQ_KEY, seq)
  return seq
}
