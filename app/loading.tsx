import styles from './loading.module.css'

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSkeleton} />
        <div className={styles.buttonSkeleton} />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.rowSkeleton} />
      ))}
    </div>
  )
}
