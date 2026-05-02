import { useNavigate } from "react-router-dom";
import { getCurrentUserEmail } from "../../services/AuthService";
import { deleteEmployee } from "../../services/EmployeeService";
import "./EmployeeRow.css";

function EmployeeRow({ employee, onEmployeeDeleted }) {
    const navigate = useNavigate();
    const currentUserEmail = String(getCurrentUserEmail() || "").toLowerCase();
    const employeeEmail = String(employee.email || "").toLowerCase();

    const isAdmin = String(employee.position || "").toLowerCase().includes("admin");
    const isCurrentUser = currentUserEmail === employeeEmail;
    const canManageEmployee = !isAdmin || isCurrentUser;

    function openEmployeeDetails() {
        navigate(`/employees/${employee.id}`);
    }

    function openEditEmployee() {
        navigate(`/employees/edit/${employee.id}`);
    }

    async function handleDeleteEmployee() {
        if (window.confirm(`Sigurno želiš da deaktiviureš zaposlenog ${employee.firstName} ${employee.lastName}?`)) {
            try {
                await deleteEmployee(employee.id);
                if (onEmployeeDeleted) {
                    onEmployeeDeleted(employee.id);
                }
            } catch (error) {
                alert("Greška pri deaktivaciji zaposlenog: " + error.message);
            }
        }
    }

    return (
        <tr className="employee-row">
            <td className="cell-link" onClick={openEmployeeDetails}>
                {employee.id}
            </td>
            <td className="cell-link" onClick={openEmployeeDetails}>
                {employee.firstName}
            </td>
            <td className="cell-link" onClick={openEmployeeDetails}>
                {employee.lastName}
            </td>
            <td className="cell-link employee-email" onClick={openEmployeeDetails}>
                {employee.email}
            </td>
            <td className="cell-link">
                <span className="position-badge">{employee.position}</span>
            </td>

            <td className="actions">
                {canManageEmployee && (
                    <>
                        <button
                            className="icon-btn edit-btn"
                            onClick={openEditEmployee}
                            title="Uredi"
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>

                        <button 
                            className="icon-btn delete-btn" 
                            onClick={handleDeleteEmployee}
                            title="Deaktiviraj"
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                        </button>
                    </>
                )}
            </td>
        </tr>
    );
}

export default EmployeeRow;