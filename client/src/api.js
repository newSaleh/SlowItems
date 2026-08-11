import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

export const ItemsAPI = {
  list: () => api.get('/items').then((r) => r.data),
  create: (item) => api.post('/items', item).then((r) => r.data),
  update: (id, item) => api.put(`/items/${id}`, item).then((r) => r.data),
  remove: (id) => api.delete(`/items/${id}`),
  import: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/items/import', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  setBranch: (branchName) => api.post('/items/branch', { branchName }).then((r) => r.data),
  exportUrl: ({ branchName = '', dateFrom = '', dateTo = '' } = {}) => {
    const params = new URLSearchParams({ branchName, dateFrom, dateTo })
    return `/api/items/export?${params.toString()}`
  },
}
