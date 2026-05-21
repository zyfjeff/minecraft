// Lightweight client-side stats export utilities.
//
// Two output formats:
//   * CSV — flat tabular dump of summary metrics + per-course progress.
//     Useful for spreadsheets / analytics. Implemented with a tiny escaper;
//     no external dependency.
//   * Print/PDF — relies on browser-native window.print(); a global @media
//     print stylesheet (added in styles.css) hides chrome and shows a
//     print-only "parent weekly report" panel that StatsPage renders behind
//     a `data-print-only` flag.
//
// Both routines are pure DOM/Browser APIs so the bundle size cost is zero.

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Quote if it contains comma / quote / newline; escape inner quotes.
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
}

// Trigger a CSV download with the given filename + UTF-8 BOM (for Excel).
function downloadCsv(filename, csv) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke so Safari can finish the download stream.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Build the CSV body from a structured stats payload. Two stacked sections:
// summary key/value rows + a per-course progress table.
export function buildStatsCsv(stats) {
  const lines = []
  lines.push(['CraftWords Learning Stats Export'])
  lines.push(['Generated', new Date().toISOString()])
  lines.push([])

  lines.push(['# Summary'])
  lines.push(['Metric', 'Value'])
  lines.push(['Display name', stats.displayName])
  lines.push(['Level', stats.level])
  lines.push(['Total XP', stats.xp])
  lines.push(['XP to next level', stats.xpToNext])
  lines.push(['Day streak', stats.streak])
  lines.push(['Active days this week', stats.activeDays + '/7'])
  lines.push(["Today's XP", stats.todayXp])
  lines.push(['Quests completed', stats.questCount])
  lines.push(['Words learned', stats.learnedVocab])
  lines.push(['Achievements unlocked', stats.achievementsUnlocked + '/' + stats.achievementsTotal])
  lines.push([])

  lines.push(['# Course Progress'])
  lines.push(['Title', 'Kind', 'Difficulty', 'Lessons total', 'Percent', 'Status'])
  for (const c of stats.courseProgressList || []) {
    const status = c.percent === 100 ? 'Completed' : c.percent > 0 ? 'In progress' : 'Not started'
    lines.push([c.title, c.kind, c.difficulty || '', c.lessons_count || '', c.percent + '%', status])
  }

  return rowsToCsv(lines)
}

export function exportStatsCsv(stats) {
  const csv = buildStatsCsv(stats)
  const stamp = new Date().toISOString().slice(0, 10)
  const safeName = (stats.displayName || 'learner').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  downloadCsv(`craftwords-stats-${safeName || 'learner'}-${stamp}.csv`, csv)
}

// Trigger the browser's native print dialog. Users can pick "Save as PDF"
// from the destination dropdown — yields a printable parent weekly report.
//
// We toggle a body-level class for a tick so @media print rules can target
// the report layout without polluting the on-screen view.
export function printWeeklyReport() {
  const cls = 'is-printing-report'
  document.body.classList.add(cls)
  // Defer to next frame so the print-only DOM (rendered conditionally) has
  // time to mount before the print dialog snapshots the page.
  requestAnimationFrame(() => {
    try {
      window.print()
    } finally {
      // Cleanup after the print dialog closes (sync in most browsers).
      setTimeout(() => document.body.classList.remove(cls), 200)
    }
  })
}
