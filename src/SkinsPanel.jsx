import { useState } from 'react'
import styles from './SkinsPanel.module.css'

const SKIN_TABS = [
  { id: 'locked', label: '🔒 Locked' },
  { id: 'veteran', label: '⚔️ Veteran' },
  { id: 'premium', label: '👑 Premium' },
  { id: 'coins', label: '🪙 Coins' },
  { id: 'boosts', label: '⚡ Boosts' },
  { id: 'bucks', label: '💵 Bucks' },
]

const SKIN_COLORS = ['#3ecf60','#e74c3c','#3498db','#9b59b6','#f39c12','#1abc9c','#e67e22','#e91e63','#00bcd4','#ff5722','#8bc34a','#607d8b']

function SkinCell({ color, name, locked }) {
  return (
    <div className={`${styles.skin} ${locked ? styles.locked : ''}`}>
      <div className={styles.cellPreview} style={{ background: color }}>
        {locked && <span className={styles.lockIcon}>🔒</span>}
      </div>
      <span className={styles.skinName}>{name}</span>
    </div>
  )
}

export default function SkinsPanel() {
  const [tab, setTab] = useState('locked')
  const [search, setSearch] = useState('')
  const [customUrl, setCustomUrl] = useState('')

  const skins = SKIN_COLORS.map((c, i) => ({
    color: c, name: `Skin ${i + 1}`, locked: tab === 'locked' || tab === 'veteran'
  }))

  const filtered = skins.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Skins</h2>
      <p className={styles.loginNote}>⭐ Login To Access Exclusive Member Skins!</p>

      {/* Tab strip */}
      <div className={styles.tabStrip}>
        {SKIN_TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <input
          className={styles.search}
          placeholder="Search skins..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
      </div>

      {/* Custom skin */}
      <div className={styles.customRow}>
        <span className={styles.customLabel}>Custom Skin</span>
        <input
          className={styles.customInput}
          placeholder="Image URL..."
          value={customUrl}
          onChange={e => setCustomUrl(e.target.value)}
        />
        <button className={styles.applyBtn}>Apply</button>
      </div>

      <div className={styles.divider} />

      {/* Skins grid */}
      <div className={styles.skinGrid}>
        {filtered.map((s, i) => (
          <SkinCell key={i} {...s} />
        ))}
      </div>
    </div>
  )
}
