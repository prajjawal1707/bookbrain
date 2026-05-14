const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

async function req(path, options={}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {'Content-Type':'application/json', ...options.headers},
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`)
  return data
}

async function uploadPdf(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE}/upload-pdf/`, {
    method: 'POST',
    body: formData,
    // No Content-Type header — browser sets it with boundary automatically
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  health:         ()        => req('/health'),
  listPackages:   ()        => req('/packages'),
  deletePackage:  (id)      => req(`/packages/${id}`, {method:'DELETE'}),
  analyzeBook:    (payload) => req('/analyze-book/',    {method:'POST', body:payload}),
  generatePrompt: (payload) => req('/generate-prompt/', {method:'POST', body:payload}),
  respond:        (payload) => req('/respond/',          {method:'POST', body:payload}),
  generateQuiz:   (payload) => req('/generate-quiz/',   {method:'POST', body:payload}),
  uploadPdf:      (file)    => uploadPdf(file),
}