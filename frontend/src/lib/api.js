const BASE = '/api'
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
export const api = {
  health:         ()        => req('/health'),
  listPackages:   ()        => req('/packages'),
  deletePackage:  (id)      => req(`/packages/${id}`, {method:'DELETE'}),
  analyzeBook:    (payload) => req('/analyze-book/',    {method:'POST', body:payload}),
  generatePrompt: (payload) => req('/generate-prompt/', {method:'POST', body:payload}),
  respond:        (payload) => req('/respond/',          {method:'POST', body:payload}),
  generateQuiz:   (payload) => req('/generate-quiz/',   {method:'POST', body:payload}),
}
