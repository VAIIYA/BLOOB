import { useState } from 'react'
import styles from './SettingsModal.module.css'

const TABS = ['Gameplay', 'Themes', 'Controls', 'Region']

const THEMES = [
  { id: 'hex', label: 'Hex', pattern: 'hexagonal' },
  { id: 'grid', label: 'Grid', pattern: 'grid' },
  { id: 'empty', label: 'Empty', pattern: 'empty' },
]
const COLORS = [
  { id: 'gray', label: 'Gray', color: '#555' },
  { id: 'white', label: 'White', color: '#ccc' },
  { id: 'black', label: 'Black', color: '#222' },
]

const CONTROLS = [
  { action: 'Feed', key: 'W' },
  { action: 'Split', key: 'Space' },
  { action: 'Double Split', key: 'Q' },
  { action: 'Triple Split', key: 'E' },
  { action: '16x Split', key: 'R' },
  { action: 'Freeze (Line Split)', key: 'Ctrl' },
  { action: 'Vertical (Line Split)', key: 'Alt' },
  { action: 'Hide UI (For Clips)', key: 'H' },
]

function Toggle({ label, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className={styles.toggle}>
      <span>{label}</span>
      <button
        className={`${styles.toggleBtn} ${on ? styles.on : ''}`}
        onClick={() => setOn(!on)}
      >
        <div className={styles.toggleKnob} />
      </button>
    </div>
  )
}

function SegmentControl({ label, options, defaultVal }) {
  const [val, setVal] = useState(defaultVal || options[0])
  return (
    <div className={styles.segmentWrap}>
      <span className={styles.segLabel}>{label}</span>
      <div className={styles.segment}>
        {options.map(o => (
          <button
            key={o}
            className={`${styles.segBtn} ${val === o ? styles.active : ''}`}
            onClick={() => setVal(o)}
          >{o}</button>
        ))}
      </div>
    </div>
  )
}

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState('Gameplay')
  const [theme, setTheme] = useState('hex')
  const [color, setColor] = useState('gray')

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.active : ''}`}
              onClick={() => setTab(t)}
            >{t}</button>
          ))}
        </div>

        <div className={styles.content}>
          {tab === 'Gameplay' && (
            <div className={styles.section}>
              <h3>General Options</h3>
              <Toggle label="Skip Match Results" />

              <h3>Render Options</h3>
              <SegmentControl label="Show Names" options={['All','Party','Self','None']} defaultVal="All" />
              <SegmentControl label="Show Skins" options={['All','Party','Self','None']} defaultVal="All" />
              <Toggle label="Auto Zoom" defaultOn={true} />
              <Toggle label="Mouse Arrow" defaultOn={true} />
              <Toggle label="Show Mass" />
              <Toggle label="Hide Food" />
              <Toggle label="Hide Border" />

              <h3>UI Options</h3>
              <Toggle label="Disable Profanity Filter" />
              <Toggle label="Hide XP Bar" />
              <Toggle label="Hide Chat" />
            </div>
          )}

          {tab === 'Themes' && (
            <div className={styles.section}>
              <h3>Theme</h3>
              <div className={styles.themeGrid}>
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    className={`${styles.themeBtn} ${theme === t.id ? styles.selected : ''}`}
                    onClick={() => setTheme(t.id)}
                  >
                    <div className={styles.themePreview} data-pattern={t.pattern} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <h3>Color</h3>
              <div className={styles.colorGrid}>
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    className={`${styles.colorBtn} ${color === c.id ? styles.selected : ''}`}
                    onClick={() => setColor(c.id)}
                    style={{ '--c': c.color }}
                  >
                    <div className={styles.colorSwatch} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'Controls' && (
            <div className={styles.section}>
              <button className={styles.resetBtn}>Reset Controls</button>
              {CONTROLS.map(c => (
                <div key={c.action} className={styles.controlRow}>
                  <span>{c.action}</span>
                  <kbd className={styles.key}>{c.key}</kbd>
                </div>
              ))}
            </div>
          )}

          {tab === 'Region' && (
            <div className={styles.section}>
              {['North America', 'Europe', 'Asia', 'South America', 'Australia'].map(r => (
                <button key={r} className={styles.regionBtn}>{r}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
