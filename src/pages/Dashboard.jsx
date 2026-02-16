import { useContext } from "react";
import { PatientsContext } from "../contexts/PatientsContext";
import ProcedureFlow from "../components/ProcedureFlow";

const Dashboard = () => {
    const { patients } = useContext(PatientsContext);

    return (
        <div>
            <h1>Procedimentos em Andamento</h1>
            {patients.map((patient) => (
                <ProcedureFlow key={patient.id} patient={patient} />
            ))}
        </div>
    );
};

export default Dashboard;