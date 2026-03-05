import { useState } from 'react'
import GameCanvas from './GameCanvas'
import Rankings from './Rankings'
import PlayPanel from './PlayPanel'
import SkinsPanel from './SkinsPanel'
import SettingsModal from './SettingsModal'
import MatchResults from './MatchResults'
import styles from './App.module.css'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [playing, setPlaying] = useState(false)

  function handlePlay(name, server, mode, spectate) {
    setConnecting(true)
    setTimeout(() => {
      setConnecting(false)
      // Simulate a short match then show results
      setPlaying(true)
      setTimeout(() => {
        setPlaying(false)
        setShowResults(true)
      }, 2000)
    }, 1200)
  }

  function handleContinue() {
    setShowResults(false)
  }

  return (
    <>
      <GameCanvas />

      {/* Main UI */}
      <div className={styles.ui}>
        {/* Left panel - Rankings */}
        <div className={styles.left}>
          <Rankings />
        </div>

        {/* Center - Play panel */}
        <div className={styles.center}>
          <PlayPanel
            onPlay={handlePlay}
            onSettings={() => setShowSettings(true)}
            onLogin={() => {}}
          />
        </div>

        {/* Right panel - Skins */}
        <div className={styles.right}>
          <SkinsPanel />
        </div>
      </div>

      {/* Connecting overlay */}
      {connecting && (
        <div className={styles.connectingOverlay}>
          <div className={styles.connectingBox}>
            <div className={styles.spinner} />
            <h2>Connecting</h2>
            <p>Finding the best server...</p>
          </div>
        </div>
      )}

      {/* Playing indicator */}
      {playing && (
        <div className={styles.playingOverlay}>
          <div className={styles.playingBox}>
            <div className={styles.playingCell} />
            <p>Playing...</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showResults && <MatchResults stats={{}} onContinue={handleContinue} />}
    </>
  )
}
