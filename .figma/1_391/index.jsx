import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.container3}>
      <div className={styles.background}>
        <div className={styles.icDirectionsRightSvg2}>
          <img
            src="../image/mhwv997c-7bnl0dm.svg"
            className={styles.icDirectionsRightSvg}
          />
        </div>
        <div className={styles.container}>
          <p className={styles.chNChiUi}>Chọn chiều đi</p>
          <p className={styles.thXuNbxGiPbtNgY16112}>
            Thọ Xuân - BX Giáp Bát | Ngày 16/11/2025
          </p>
        </div>
      </div>
      <div className={styles.background2}>
        <div className={styles.autoWrapper}>
          <div className={styles.icDirectionsRightSvg3}>
            <img
              src="../image/mhwv997c-ykkdvrj.png"
              className={styles.icDirectionsRightSvg}
            />
          </div>
        </div>
        <div className={styles.container2}>
          <p className={styles.chNChiUi}>Chọn chiều về</p>
          <p className={styles.thXuNbxGiPbtNgY16112}>
            BX Giáp Bát - Thọ Xuân | Ngày 18/11/2025
          </p>
        </div>
      </div>
    </div>
  );
}

export default Component;
