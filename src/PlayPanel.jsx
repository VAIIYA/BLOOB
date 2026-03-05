import { useState } from 'react'
import styles from './PlayPanel.module.css'

const SERVERS = ['North America', 'Europe', 'Asia', 'South America', 'Australia']
const MODES = ['FFA', 'Teams', 'Battle Royale', 'Experimental']

export default function PlayPanel({ onPlay, onSettings, onLogin }) {
  const [name, setName] = useState('')
  const [server, setServer] = useState('North America')
  const [mode, setMode] = useState('FFA')
  const [spectate, setSpectate] = useState(false)

  return (
    <div className={styles.container}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="32" fill="#3ecf60" opacity="0.9"/>
            <circle cx="40" cy="40" r="28" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.3"/>
            <circle cx="28" cy="30" r="6" fill="#fff" opacity="0.7"/>
            <circle cx="52" cy="28" r="4" fill="#fff" opacity="0.5"/>
            <circle cx="50" cy="52" r="3" fill="#fff" opacity="0.4"/>
            {/* Spikes */}
            {[0,45,90,135,180,225,270,315].map((a, i) => {
              const rad = a * Math.PI / 180
              const x1 = 40 + 32 * Math.cos(rad)
              const y1 = 40 + 32 * Math.sin(rad)
              const x2 = 40 + 42 * Math.cos(rad)
              const y2 = 40 + 42 * Math.sin(rad)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3ecf60" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
            })}
          </svg>
        </div>
        <span className={styles.logoText}>GERMS<span>.IO</span></span>
      </div>

      {/* Name input */}
      <div className={styles.inputWrap}>
        <input
          className={styles.nameInput}
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={e => setName(e.target.value.slice(0, 24))}
          maxLength={24}
        />
      </div>

      {/* Server/Mode selectors */}
      <div className={styles.selectors}>
        <select className={styles.select} value={server} onChange={e => setServer(e.target.value)}>
          {SERVERS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className={styles.select} value={mode} onChange={e => setMode(e.target.value)}>
          {MODES.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Play buttons */}
      <div className={styles.playButtons}>
        <button
          className={`${styles.btn} ${styles.playBtn}`}
          onClick={() => onPlay(name, server, mode)}
        >
          ▶ Play
        </button>
        <button
          className={`${styles.btn} ${styles.spectateBtn}`}
          onClick={() => onPlay(name, server, mode, true)}
        >
          👁 Spectate
        </button>
        <button
          className={`${styles.btn} ${styles.settingsBtn}`}
          onClick={onSettings}
        >
          ⚙ Settings
        </button>
      </div>

      {/* Login panel */}
      <div className={styles.loginPanel}>
        <div className={styles.loginIcon}>🔒</div>
        <p className={styles.loginText}>Sign in to access member only features, 100% free!</p>
        <ul className={styles.perks}>
          <li>✓ Access to Public Chat</li>
          <li>✓ Bonus Starting Mass</li>
          <li>✓ Free Coins Every Day</li>
        </ul>
        <div className={styles.loginBtns}>
          <button className={`${styles.btn} ${styles.discordBtn}`} onClick={onLogin}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.018.01.036.027.047 2.04 1.5 4.022 2.413 5.967 3.017a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.993a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028c1.952-.604 3.935-1.516 5.975-3.017a.077.077 0 0 0 .026-.047c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            Sign in With Discord
          </button>
          <button className={`${styles.btn} ${styles.googleBtn}`} onClick={onLogin}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in With Google
          </button>
        </div>
      </div>

      {/* Social links */}
      <div className={styles.social}>
        <a href="https://discord.gg/GZzX5JW" target="_blank" rel="noreferrer" className={styles.socialIcon} title="Discord">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.018.01.036.027.047 2.04 1.5 4.022 2.413 5.967 3.017a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.993a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028c1.952-.604 3.935-1.516 5.975-3.017a.077.077 0 0 0 .026-.047c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
        </a>
        <a href="https://youtube.com/c/Germsio" target="_blank" rel="noreferrer" className={styles.socialIcon} title="YouTube">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </a>
        <a href="https://reddit.com/r/Germsio" target="_blank" rel="noreferrer" className={styles.socialIcon} title="Reddit">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
        </a>
        <a href="https://facebook.com/Germs.io" target="_blank" rel="noreferrer" className={styles.socialIcon} title="Facebook">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
      </div>

      {/* Version */}
      <div className={styles.version}>Version: 5.0.0</div>
    </div>
  )
}
