import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.menu}>
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>
          <span className={styles.titleMagenta}>PULSE</span>
          <span className={styles.titleCyan}>PARRY</span>
        </h1>
        <p className={styles.subtitle}>360° RHYTHM PARRY SURVIVOR</p>
      </div>

      <div className={styles.actions}>
        <Link href="/play" className={styles.startBtn}>
          ▶ START
        </Link>
      </div>

      <div className={styles.hints}>
        <p><kbd>마우스</kbd> 조준 · <kbd>SPACE</kbd> 패링 · <kbd>놓기</kbd> 반격</p>
      </div>
    </main>
  );
}
