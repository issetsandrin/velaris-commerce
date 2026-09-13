import styles from "./Skeleton.module.css";

/** Bloco cinza que ocupa o lugar do conteúdo enquanto ele não chega. */
export function Skeleton({ height = "1rem", width = "100%", radius = "4px" }: {
  height?: string;
  width?: string;
  radius?: string;
}) {
  return <span className={styles.bloco} style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}

/** Cartão no formato de um pedido, usado enquanto a lista carrega. */
export function SkeletonOrder() {
  return (
    <div className={styles.order} aria-hidden="true">
      <div className={styles.row}>
        <Skeleton width="9rem" height="1.1rem" />
        <Skeleton width="5.5rem" height="1.6rem" radius="999px" />
      </div>
      <div className={styles.item}>
        <Skeleton width="3.25rem" height="3.25rem" />
        <div className={styles.lines}>
          <Skeleton width="11rem" height="1rem" />
          <Skeleton width="7rem" height="0.8rem" />
        </div>
        <Skeleton width="5rem" height="1rem" />
      </div>
      <div className={styles.row}>
        <Skeleton width="60%" height="0.8rem" />
        <Skeleton width="6rem" height="1.2rem" />
      </div>
    </div>
  );
}

/** Card no formato de uma vela da vitrine. */
export function SkeletonProduct() {
  return (
    <div className={styles.product} aria-hidden="true">
      <Skeleton height="0" width="100%" radius="4px" />
      <div className={styles.art} />
      <Skeleton width="70%" height="1.2rem" />
      <Skeleton width="45%" height="0.85rem" />
      <div className={styles.row}>
        <Skeleton width="5.5rem" height="1.5rem" />
        <Skeleton width="7rem" height="2.6rem" />
      </div>
    </div>
  );
}
