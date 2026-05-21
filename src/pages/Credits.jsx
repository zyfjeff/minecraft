import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

// Credits — the central attribution page for all third-party content.
//
// We aggregate every active course's source_label / source_url / source_license
// columns, plus a static block thanking the upstream communities (Minecraft
// Wiki + the YouTube channel "English from the Ground Up"). This lives at
// /credits and is linked from the global footer per the CC-BY-SA 4.0
// requirement that the original work and license be properly attributed.
export default function Credits(qoderProps) {
  const { courses, coursesLoaded } = useAuth()

  // Group courses by source_label so each upstream gets one card.
  const groups = (courses || []).reduce((acc, c) => {
    const key = c.source_label || 'Other'
    if (!acc[key]) acc[key] = { label: key, url: c.source_url, license: c.source_license, items: [] }
    acc[key].items.push(c)
    return acc
  }, {})
  const groupList = Object.values(groups).sort((a, b) => a.label.localeCompare(b.label))

  return (
    <div data-component="credits-page" style={{ ...({ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id="qel-credits-page-2baedce1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-credits-page-2baedce1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;credits-page&quot;,&quot;loc&quot;:{&quot;line&quot;:24,&quot;column&quot;:5}}">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }} data-qoder-id="qel-div-e2cd1419" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e2cd1419&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:25,&quot;column&quot;:7}}">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-grass)', fontWeight: 600, fontSize: '14px' }} data-qoder-id="qel-link-7ad12c22" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-7ad12c22&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:26,&quot;column&quot;:9}}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" data-qoder-id="qel-svg-9421658b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-9421658b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:27,&quot;column&quot;:11}}"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"  data-qoder-id="qel-path-5c4e6642" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-5c4e6642&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:27,&quot;column&quot;:79}}"/></svg>
          Back home
        </Link>
      </div>

      <header className="card" style={{ padding: 'var(--space-lg)' }} data-qoder-id="qel-card-837193b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-837193b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:32,&quot;column&quot;:7}}">
        <h2 style={{ marginTop: 0, marginBottom: 'var(--space-sm)' }} data-qoder-id="qel-h2-d6ebf1f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h2-d6ebf1f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;h2&quot;,&quot;loc&quot;:{&quot;line&quot;:33,&quot;column&quot;:9}}">Credits & Attribution</h2>
        <p style={{ fontSize: 14, color: 'var(--color-body)', lineHeight: 1.6, margin: 0 }} data-qoder-id="qel-p-2671d5df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-2671d5df&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:34,&quot;column&quot;:9}}">
          CraftWords is built on top of two amazing communities. Reading passages
          are short paraphrases of articles from <strong data-qoder-id="qel-strong-afd90c3e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-afd90c3e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:36,&quot;column&quot;:50}}">Minecraft Wiki</strong>,
          shared under <strong data-qoder-id="qel-strong-d09a5922" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-d09a5922&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:37,&quot;column&quot;:24}}">CC BY-SA 4.0</strong>. Listening lessons embed
          videos from the YouTube channel{' '}
          <strong data-qoder-id="qel-strong-d19a5ab5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-d19a5ab5&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:39,&quot;column&quot;:11}}">English from the Ground Up</strong> via the official IFrame
          Player — we never download or redistribute their captions. Huge thanks
          to both for making language learning more fun.
        </p>
      </header>

      <section data-component="credits-by-source" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }} data-qoder-id="qel-credits-by-source-40fae6c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-credits-by-source-40fae6c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;credits-by-source&quot;,&quot;loc&quot;:{&quot;line&quot;:45,&quot;column&quot;:7}}">
        {!coursesLoaded ? (
          <p style={{ fontSize: 13, color: 'var(--color-muted)' }} data-qoder-id="qel-p-6144f275" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-6144f275&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:47,&quot;column&quot;:11}}">Loading credits…</p>
        ) : groupList.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-muted)' }} data-qoder-id="qel-p-5a44e770" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-5a44e770&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:49,&quot;column&quot;:11}}">No courses published yet.</p>
        ) : (
          groupList.map((g) => (
            <div key={g.label} className="card-flat" style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-lg)',
            }} data-qoder-id="qel-card-flat-5d539064" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-flat-5d539064&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;card-flat&quot;,&quot;loc&quot;:{&quot;line&quot;:52,&quot;column&quot;:13}}">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }} data-qoder-id="qel-div-a5cf2462" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a5cf2462&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:57,&quot;column&quot;:15}}">
                <h3 style={{ margin: 0, fontSize: 16 }} data-qoder-id="qel-h3-6cd67fa7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h3-6cd67fa7&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;h3&quot;,&quot;loc&quot;:{&quot;line&quot;:58,&quot;column&quot;:17}}">
                  {g.url ? (
                    <a href={g.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-grass-active)', textDecoration: 'none' }} data-qoder-id="qel-a-8c527eac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-a-8c527eac&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;a&quot;,&quot;loc&quot;:{&quot;line&quot;:60,&quot;column&quot;:21}}">
                      {g.label} ↗
                    </a>
                  ) : g.label}
                </h3>
                {g.license ? (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--color-grass-active)',
                    background: 'var(--color-grass-wash)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                  }} data-qoder-id="qel-span-dd8442df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-dd8442df&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:66,&quot;column&quot;:19}}">
                    {g.license}
                  </span>
                ) : null}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }} data-qoder-id="qel-ul-76484325" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ul-76484325&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;ul&quot;,&quot;loc&quot;:{&quot;line&quot;:77,&quot;column&quot;:15}}">
                {g.items.map((c) => (
                  <li key={c.id} style={{ fontSize: 13, color: 'var(--color-body)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }} data-qoder-id="qel-li-e24cd1de" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-e24cd1de&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:79,&quot;column&quot;:19}}">
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: 'var(--color-muted)',
                      background: 'var(--color-surface-soft)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      textTransform: 'uppercase',
                    }} data-qoder-id="qel-span-588bc045" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-588bc045&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:21}}">
                      {c.kind}
                    </span>
                    <Link
                      to={c.kind === 'listening' ? `/video/${c.id}` : `/reading/${c.id}`}
                      style={{ color: 'var(--color-body)', textDecoration: 'none' }}
                     data-qoder-id="qel-link-704aa9f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-704aa9f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:90,&quot;column&quot;:21}}">
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <p style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'center', marginTop: 'var(--space-md)' }} data-qoder-id="qel-p-ec4c890b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-ec4c890b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:104,&quot;column&quot;:7}}">
        Have a copyright concern? Email <a href="mailto:hello@craftwords.app" style={{ color: 'var(--color-muted)' }} data-qoder-id="qel-a-0159f2a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-a-0159f2a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Credits.jsx&quot;,&quot;componentName&quot;:&quot;Credits&quot;,&quot;elementRole&quot;:&quot;a&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:41}}">hello@craftwords.app</a> and we'll respond within 7 days.
      </p>
    </div>
  )
}
