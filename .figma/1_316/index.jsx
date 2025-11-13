import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.form}>
      <div className={styles.container2}>
        <div className={styles.container}>
          <img
            src="../image/mhw881ji-3s6h4o4.svg"
            className={styles.icFilterOutlineSvg}
          />
          <p className={styles.bLc}>BỘ LỌC</p>
        </div>
        <p className={styles.xAblc}>Xóa bộ lọc</p>
      </div>
      <div className={styles.heading3}>
        <p className={styles.loIXe}>Loại xe</p>
      </div>
      <div className={styles.list}>
        <div className={styles.itemLabel}>
          <div className={styles.input} />
          <p className={styles.gIngnm}>GIƯỜNG NẰM</p>
        </div>
        <div className={styles.itemLabel}>
          <div className={styles.input} />
          <p className={styles.gIngnm}>LIMOUSINE-CABIN</p>
        </div>
      </div>
      <div className={styles.heading32}>
        <p className={styles.loIXe}>Giờ chạy</p>
      </div>
      <div className={styles.container4}>
        <div className={styles.container3}>
          <div className={styles.background} />
        </div>
        <div className={styles.backgroundBorderShad} />
      </div>
      <div className={styles.autoWrapper}>
        <p className={styles.a0000}>00:00</p>
        <p className={styles.a2359}>23:59</p>
        <div className={styles.heading33}>
          <p className={styles.loIXe}>Lượng ghế trống</p>
        </div>
      </div>
      <div className={styles.container4}>
        <div className={styles.container3}>
          <div className={styles.background} />
        </div>
        <div className={styles.backgroundBorderShad} />
      </div>
      <div className={styles.autoWrapper2}>
        <p className={styles.a0}>0</p>
        <p className={styles.a60}>60</p>
      </div>
    </div>
  );
}

export default Component;
