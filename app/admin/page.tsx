import PatientCountSummary from "./_components/patient-count-summary";
import PatientMetrics from "./_components/patient-metrics";

const Dashboard = () => {
    return (
        <div className="grid gap-4">
            <PatientCountSummary />

            <PatientMetrics />
        </div>
    );
};

export default Dashboard;
