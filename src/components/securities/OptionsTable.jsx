import "./OptionsTable.css";

// CALLs are in-the-money when the strike sits below the underlying spot
// (you can buy at strike and immediately sell at the higher spot). PUTs are
// the mirror image — ITM when strike > spot. The colour pair (green ITM,
// red OTM) mirrors the cheat-sheet legend rendered above the table so a
// reader who doesn't remember the convention has it within glance distance
// (review.md scenarios 21, 71).
function classify(side, strike, sharedPrice) {
  if (side === "call") {
    if (strike < sharedPrice) return "itm";
    if (strike > sharedPrice) return "otm";
  } else {
    if (strike > sharedPrice) return "itm";
    if (strike < sharedPrice) return "otm";
  }
  return null; // ATM — neutral cell.
}

function cellClass(state) {
  if (state === "itm") return "ot-cell ot-cell--itm";
  if (state === "otm") return "ot-cell ot-cell--otm";
  return "ot-cell";
}

function fmtMoney(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `$${value.toFixed(2)}`;
}

function OptionsTable({ options, sharedPrice }) {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="ot-wrap">
      <h3 style={{ margin: "0 0 10px" }}>Opcije</h3>

      <div className="ot-legend">
        <span className="ot-legend-chip ot-legend-chip--itm">In-The-Money</span>
        <span style={{ color: "#94a3b8" }}>strike povoljan u odnosu na trenutnu cenu</span>
        <span style={{ flex: 1 }} />
        <span className="ot-legend-chip ot-legend-chip--otm">Out-Of-The-Money</span>
        <span style={{ color: "#94a3b8" }}>strike nepovoljan</span>
        <span style={{ flex: 1 }} />
        <span className="ot-legend-chip ot-legend-chip--shared">
          Shared Price: {fmtMoney(sharedPrice)}
        </span>
      </div>

      {options.map((optionSet) => (
        <div key={optionSet.settlementDate} className="ot-set">
          <h4 className="ot-set-header">
            📅 {optionSet.settlementDate} ({optionSet.daysToExpiry} dana)
          </h4>

          <div className="ot-scroll">
            <table className="ot-table">
              <thead>
                <tr className="ot-headline">
                  <th colSpan="6" className="ot-headline-call">CALLS</th>
                  <th className="ot-headline-strike">Strike</th>
                  <th colSpan="6" className="ot-headline-put">PUTS</th>
                </tr>
                <tr className="ot-subhead">
                  <th>Last</th>
                  <th>Theta</th>
                  <th>Bid</th>
                  <th>Ask</th>
                  <th>Vol</th>
                  <th>OI</th>
                  <th></th>
                  <th>Last</th>
                  <th>Theta</th>
                  <th>Bid</th>
                  <th>Ask</th>
                  <th>Vol</th>
                  <th>OI</th>
                </tr>
              </thead>
              <tbody>
                {optionSet.options.map((option, idx) => {
                  const callState = classify("call", option.strike, sharedPrice);
                  const putState = classify("put", option.strike, sharedPrice);
                  const callCls = cellClass(callState);
                  const putCls = cellClass(putState);
                  return (
                    <tr key={idx}>
                      <td className={callCls}>{option.callLast.toFixed(2)}</td>
                      <td className={callCls}>{option.callTheta.toFixed(2)}</td>
                      <td className={callCls}>{option.callBid.toFixed(2)}</td>
                      <td className={callCls}>{option.callAsk.toFixed(2)}</td>
                      <td className={callCls}>{option.callVol}</td>
                      <td className={callCls}>{option.callOI}</td>

                      <td className="ot-cell ot-cell--strike">${option.strike}</td>

                      <td className={putCls}>{option.putLast.toFixed(2)}</td>
                      <td className={putCls}>{option.putTheta.toFixed(2)}</td>
                      <td className={putCls}>{option.putBid.toFixed(2)}</td>
                      <td className={putCls}>{option.putAsk.toFixed(2)}</td>
                      <td className={putCls}>{option.putVol}</td>
                      <td className={putCls}>{option.putOI}</td>
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
