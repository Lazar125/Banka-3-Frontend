// za grafikon se koristi recharts biblioteka
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function SecurityChart({ data, period, setPeriod }) {
  const periods = ["1D", "1W", "1M", "1Y", "5Y"];

  return (
    <div style={{ marginBottom: "30px" }}>
      <div style={{ marginBottom: "15px" }}>
        <h3>📊 Grafikon cene</h3>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "8px 15px",
                background: period === p ? "#007bff" : "#e0e0e0",
                color: period === p ? "white" : "black",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: period === p ? "bold" : "normal",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            contentStyle={{ background: "#f0f0f0", border: "1px solid #ccc" }}
            formatter={(value) => `$${value.toFixed(2)}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#1e90ff" 
            strokeWidth={2}
            dot={{ fill: "#1e90ff", r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="high" 
            stroke="#90ee90" 
            strokeWidth={1}
            strokeDasharray="5 5"
          />
          <Line 
            type="monotone" 
            dataKey="low" 
            stroke="#ff6b6b" 
            strokeWidth={1}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SecurityChart;