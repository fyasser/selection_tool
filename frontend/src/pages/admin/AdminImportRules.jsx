import { useEffect, useState } from 'react'
import { FileCode2, Plus, Save, Trash2 } from 'lucide-react'
import { authFetch } from '../../api.js'

const SECTION_OPTIONS = [
  { value: 'hardware', label: 'Controller' },
  { value: 'io', label: 'I/O' },
  { value: 'switches', label: 'Switches' },
  { value: 'hmi', label: 'HMI' },
  { value: 'licences', label: 'Licences' },
]

const emptyRule = () => ({
  id: `custom-rule-${Date.now()}`,
  label: 'New import rule',
  section: 'hardware',
  referencePrefixes: [],
  descriptionIncludes: [],
  runtimeIoPointsPerUnit: 0,
  priority: 10,
})

function listValue(value) {
  return Array.isArray(value) ? value.join(', ') : ''
}

function parseList(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export default function AdminImportRules() {
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    authFetch('http://localhost:3000/templates/import-rules')
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.message || 'Could not load import rules.')
        setDocument(body)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function updateRule(index, changes) {
    setDocument((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) => (
        ruleIndex === index ? { ...rule, ...changes } : rule
      )),
    }))
  }

  function removeRule(index) {
    setDocument((current) => ({
      ...current,
      rules: current.rules.filter((_, ruleIndex) => ruleIndex !== index),
    }))
  }

  function addRule() {
    setDocument((current) => ({ ...current, rules: [...current.rules, emptyRule()] }))
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await authFetch('http://localhost:3000/templates/import-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(document),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || 'Could not save import rules.')
      setDocument(body)
      setMessage('Import rules saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-green-600" /> Excel Import Rules
          </h2>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Tell the importer how to recognize each Excel row. Rules with a higher priority are checked first.
            Changes affect new Excel imports only.
          </p>
        </div>
        <button
          onClick={save}
          disabled={loading || saving || !document}
          className="flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-40 whitespace-nowrap"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save rules'}
        </button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading rules...</p> : (
        <>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 mb-5 text-sm text-blue-900">
            <p className="font-semibold mb-1">How to create a rule</p>
            <p>Use comma-separated values. For example, enter <strong>BMX</strong> in Reference prefixes to match every reference beginning with BMX.</p>
          </div>
          <div className="space-y-4">
            {document.rules.map((rule, index) => (
              <div key={rule.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Rule {index + 1}</p>
                    <p className="text-xs text-gray-500 mt-1">Higher priority rules take precedence when more than one rule matches.</p>
                  </div>
                  <button
                    onClick={() => removeRule(index)}
                    disabled={document.rules.length <= 1}
                    className="text-gray-400 hover:text-red-600 disabled:opacity-30"
                    aria-label={`Delete rule ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                    Rule name
                    <input
                      value={rule.label || ''}
                      onChange={(event) => updateRule(index, { label: event.target.value })}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
                      placeholder="Example: BMX X80 I/O"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                    Put matching rows in
                    <select
                      value={rule.section}
                      onChange={(event) => updateRule(index, { section: event.target.value })}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
                    >
                      {SECTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                    Reference starts with
                    <input
                      value={listValue(rule.referencePrefixes)}
                      onChange={(event) => updateRule(index, { referencePrefixes: parseList(event.target.value) })}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
                      placeholder="BMX, TM3"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                    Description contains
                    <input
                      value={listValue(rule.descriptionIncludes)}
                      onChange={(event) => updateRule(index, { descriptionIncludes: parseList(event.target.value) })}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
                      placeholder="control pack 10 i/o points"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                    Runtime I/O points per item
                    <input
                      type="number"
                      min="0"
                      value={rule.runtimeIoPointsPerUnit || 0}
                      onChange={(event) => updateRule(index, { runtimeIoPointsPerUnit: Number(event.target.value) || 0 })}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                    Priority
                    <input
                      type="number"
                      value={rule.priority || 0}
                      onChange={(event) => updateRule(index, { priority: Number(event.target.value) || 0 })}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addRule}
            className="mt-4 flex items-center gap-2 rounded-lg border border-green-600 text-green-700 px-4 py-2 text-sm font-medium hover:bg-green-50"
          >
            <Plus className="w-4 h-4" /> Add rule
          </button>
        </>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
    </section>
  )
}
