import { useState } from 'react'
import styles from './Rankings.module.css'

const mockRankings = [
  { rank: 1, name: 'xXCellKingXx', score: 48200, level: 87, color: '#f1c40f' },
  { rank: 2, name: 'Amoeba God', score: 41800, level: 72, color: '#c0c0c0' },
  { rank: 3, name: 'NuclearCell', score: 38550, level: 65, color: '#cd7f32' },
  { rank: 4, name: 'Virus99', score: 32100, level: 58, color: '#3ecf60' },
  { rank: 5, name: 'BlobMaster', score: 28400, level: 54, color: '#3ecf60' },
  { rank: 6, name: 'CellSurgeon', score: 24900, level: 49, color: '#3ecf60' },
  { rank: 7, name: 'GermHunter', score: 21300, level: 44, color: '#3ecf60' },
  { rank: 8, name: 'SplitKing', score: 19800, level: 41, color: '#3ecf60' },
  { rank: 9, name: 'MassGainer', score: 17400, level: 37, color: '#3ecf60' },
  { rank: 10, name: 'QuickSplit', score: 15200, level: 33, color: '#3ecf60' },
]

export default function Rankings() {
  const [tab, setTab] = useState('levels')

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Rankings</h2>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'levels' ? styles.active : ''}`}
          onClick={() => setTab('levels')}
        >Levels</button>
        <button
          className={`${styles.tab} ${tab === 'coins' ? styles.active : ''}`}
          onClick={() => setTab('coins')}
        >Coins</button>
      </div>
      <div className={styles.list}>
        {mockRankings.map(p => (
          <div key={p.rank} className={styles.row}>
            <span className={styles.rank} style={{ color: p.rank <= 3 ? p.color : 'var(--text-muted)' }}>
              {p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank - 1] : `#${p.rank}`}
            </span>
            <div className={styles.avatar} style={{ borderColor: p.color }}>
              <div className={styles.cell} style={{ background: p.color }} />
            </div>
            <span className={styles.name}>{p.name}</span>
            <span className={styles.score}>Lv.{p.level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
