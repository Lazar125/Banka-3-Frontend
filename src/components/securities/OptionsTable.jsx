function OptionsTable({ options, sharedPrice }) {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: "30px" }}>
      <h3>Opcije</h3>

      {options.map((optionSet) => (
        <div key={optionSet.settlementDate} style={{ marginBottom: "30px" }}>
          <h4 style={{ marginBottom: "10px" }}>
            📅 {optionSet.settlementDate} ({optionSet.daysToExpiry} dana)
          </h4>

          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              fontSize: "12px",
              border: "1px solid #ddd",
            }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th colSpan="6" style={{ background: "#90ee90", padding: "8px", textAlign: "center", fontWeight: "bold" }}>
                    CALLS
                  </th>
                  <th style={{ background: "#ddd", padding: "8px", textAlign: "center", fontWeight: "bold", width: "80px" }}>
                    Strike
                  </th>
                  <th colSpan="6" style={{ background: "#ffb3b3", padding: "8px", textAlign: "center", fontWeight: "bold" }}>
                    PUTS
                  </th>
                </tr>
                <tr style={{ background: "#f8f9fa", fontSize: "11px" }}>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Last</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Theta</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Bid</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Ask</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Vol</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>OI</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}></th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Last</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Theta</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Bid</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Ask</th>
                  <th style={{ padding: "6px", borderRight: "1px solid #ddd" }}>Vol</th>
                  <th style={{ padding: "6px" }}>OI</th>
                </tr>
              </thead>
              <tbody>
                {optionSet.options.map((option, idx) => {
                  const isITM = option.strike < sharedPrice;
                  const isOTM = option.strike > sharedPrice;
                  
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isITM ? "#c8e6c9" : isOTM ? "#ffcccc" : "#fff",
                      }}>
                        {option.callLast.toFixed(2)}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isITM ? "#c8e6c9" : isOTM ? "#ffcccc" : "#fff",
                      }}>
                        {option.callTheta.toFixed(2)}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isITM ? "#c8e6c9" : isOTM ? "#ffcccc" : "#fff",
                      }}>
                        {option.callBid.toFixed(2)}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isITM ? "#c8e6c9" : isOTM ? "#ffcccc" : "#fff",
                      }}>
                        {option.callAsk.toFixed(2)}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isITM ? "#c8e6c9" : isOTM ? "#ffcccc" : "#fff",
                      }}>
                        {option.callVol}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isITM ? "#c8e6c9" : isOTM ? "#ffcccc" : "#fff",
                        borderRight: "1px solid #ddd",
                      }}>
                        {option.callOI}
                      </td>
                      
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: "#ffd700",
                        fontWeight: "bold",
                        borderRight: "1px solid #ddd",
                      }}>
                        ${option.strike}
                      </td>
                      
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isOTM ? "#c8e6c9" : isITM ? "#ffcccc" : "#fff",
                      }}>
                        {option.putLast.toFixed(2)}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isOTM ? "#c8e6c9" : isITM ? "#ffcccc" : "#fff",
                      }}>
                        {option.putTheta.toFixed(2)}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isOTM ? "#c8e6c9" : isITM ? "#ffcccc" : "#fff",
                      }}>
                        {option.putBid.toFixed(2)}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isOTM ? "#c8e6c9" : isITM ? "#ffcccc" : "#fff",
                      }}>
                        {option.putAsk.toFixed(2)}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isOTM ? "#c8e6c9" : isITM ? "#ffcccc" : "#fff",
                      }}>
                        {option.putVol}
                      </td>
                      <td style={{
                        padding: "6px",
                        textAlign: "center",
                        background: isOTM ? "#c8e6c9" : isITM ? "#ffcccc" : "#fff",
                      }}>
                        {option.putOI}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OptionsTable;