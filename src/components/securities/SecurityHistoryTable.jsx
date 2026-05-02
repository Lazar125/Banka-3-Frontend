function SecurityHistoryTable({ data }) {
  return (
    <div style={{ marginBottom: "30px" }}>
      <h3>📈 Istorijski podaci</h3>
      
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        borderRadius: "5px",
        overflow: "hidden",
      }}>
        <thead>
          <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: "12px", textAlign: "left" }}>Datum</th>
            <th style={{ padding: "12px", textAlign: "right" }}>Cena</th>
            <th style={{ padding: "12px", textAlign: "right" }}>High</th>
            <th style={{ padding: "12px", textAlign: "right" }}>Low</th>
            <th style={{ padding: "12px", textAlign: "right" }}>Volume</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "12px" }}>{row.date}</td>
              <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>
                ${row.price.toFixed(2)}
              </td>
              <td style={{ padding: "12px", textAlign: "right", color: "green" }}>
                ${row.high.toFixed(2)}
              </td>
              <td style={{ padding: "12px", textAlign: "right", color: "red" }}>
                ${row.low.toFixed(2)}
              </td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                {(row.volume / 1000000).toFixed(1)}M
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SecurityHistoryTable;