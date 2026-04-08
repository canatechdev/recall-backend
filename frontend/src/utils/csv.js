export const downloadCsv = ({ filename, rows }) => {
  const escapeCell = (cell) => {
    const str = String(cell ?? '')
    if (/[\",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`
    return str
  }

  const csv = (rows || []).map((row) => (row || []).map(escapeCell).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'export.csv'
  a.click()
  URL.revokeObjectURL(url)
}
