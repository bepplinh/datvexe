import styles from "./styles.module.scss";

function MainLayout({children}) {
    const { wrapLayout, container } = styles;
    return (
        <div className={wrapLayout}>
            <div className={container}>
               {children}
            </div>
        </div>
    );
}

export default MainLayout;