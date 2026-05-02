import EmployeeRow from "./EmployeeRow";
import "./EmployeeTable.css";

function EmployeeTable({ employees, onEmployeeDeleted }) {
  if (employees.length === 0) {
    return (
      <div className="no-results">
        <p>Nema zaposlenih koji odgovaraju vašoj pretrazi</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="employee-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ime</th>
            <th>Prezime</th>
            <th>Email</th>
            <th>Pozicija</th>
            <th className="actions-header">Akcije</th>
          </tr>
        </thead>

        <tbody>
          {employees.map(employee => (
            <EmployeeRow 
              key={employee.id} 
              employee={employee}
              onEmployeeDeleted={onEmployeeDeleted}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeTable;