function Test() {
    const [numbers, setNumbers] = useState([]);
    return (
        <>
            <h1>Tesst</h1>
            {numbers && <p>{numbers.join(", ")}</p>}
            <input type="text" placeholder="Nhap so"/>
        </>
    );
}
export default Test;
