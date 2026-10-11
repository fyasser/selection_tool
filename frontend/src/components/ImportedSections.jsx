const LABELS = {
  hardware: 'Hardware',
  io: 'I/O',
  switches: 'Switches',
  hmi: 'HMI',
  licences: 'Licences',
  unclassified: 'Needs review',
}

export function hasImportedSections(sections, runtimeIoPoints = 0) {
  return Boolean(
    sections
    && (Object.keys(LABELS).some((key) => (sections[key] || []).length > 0)
      || Number(runtimeIoPoints) > 0)
  )
}

export function ImportedRows({ items = [] }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item.reference}-${index}`} className="rounded-xl border border-gray-200 p-3">
          <div className="grid grid-cols-[1fr_2fr_70px] gap-3 text-xs">
            <span className="font-mono text-green-700">{item.reference || '—'}</span>
            <span className="text-gray-700">{item.description || '—'}</span>
            <span className="text-gray-700">Qty: {item.quantity || 1}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ImportedClassificationSections({ sections = {}, runtimeIoPoints = 0 }) {
  const sectionLabels = [
    ['hardware', 'Hardware'],
    ['io', 'I/O'],
    ['switches', 'Switches'],
    ['hmi', 'HMI'],
    ['licences', 'Licences'],
  ]

  return (
    <section className="mb-6">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Template Classification</h4>
      <div className="space-y-3">
        {sectionLabels.map(([key, label]) => (
          <div key={key} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 text-sm font-semibold text-gray-900">
              {label}
              {key === 'licences' && runtimeIoPoints > 0 && (
                <span className="ml-2 text-xs font-medium text-green-700">
                  {runtimeIoPoints} runtime I/O points
                </span>
              )}
            </div>
            {(sections[key] || []).length > 0 ? (
              <ImportedRows items={sections[key]} />
            ) : (
              <p className="px-3 py-3 text-xs text-gray-500">No items classified here.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function ImportedSections({ sections, runtimeIoPoints }) {
  if (!hasImportedSections(sections, runtimeIoPoints)) return null
  const visibleSections = Object.entries(LABELS).filter(([key]) => (sections[key] || []).length)
  if (visibleSections.length === 0 && !runtimeIoPoints) return null

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Imported Project Schema</h4>
        {runtimeIoPoints > 0 && (
          <span className="text-xs font-medium text-green-700">{runtimeIoPoints} runtime I/O points</span>
        )}
      </div>
      <div className="space-y-3">
        {visibleSections.map(([key, label]) => (
          <div key={key} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className={`px-3 py-2 text-xs font-semibold ${
              key === 'unclassified' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'
            }`}>
              {label}
            </div>
            <div className="divide-y divide-gray-100">
              {sections[key].map((item, index) => (
                <div key={`${item.reference}-${index}`} className="grid grid-cols-[1fr_2fr_70px] gap-3 px-3 py-2 text-xs">
                  <span className="font-mono text-green-700">{item.reference || '—'}</span>
                  <span className="text-gray-700">{item.description || '—'}</span>
                  <span className="text-gray-700">Qty: {item.quantity || 1}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
