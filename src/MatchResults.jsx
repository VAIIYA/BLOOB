import styles from './MatchResults.module.css'

export default function MatchResults({ stats, onContinue }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Match Results</h2>
        <div className={styles.grid}>
          <div className={styles.stat}>
            <span className={styles.val}>{stats.food ?? 6}</span>
            <span className={styles.label}>food eaten</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.val}>{stats.mass ?? 78}</span>
            <span className={styles.label}>highest mass</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.val}>{stats.time ?? '0:05'}</span>
            <span className={styles.label}>time alive</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.val}>{stats.lbTime ?? '0:04'}</span>
            <span className={styles.label}>leaderboard time</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.val}>{stats.cells ?? 0}</span>
            <span className={styles.label}>cells eaten</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.val}>{stats.topPos ?? 40}</span>
            <span className={styles.label}>top position</span>
          </div>
        </div>
        <button className={styles.continueBtn} onClick={onContinue}>Continue</button>
      </div>
    </div>
  )
}
