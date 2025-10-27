import RecordVitals from "./_components/record-vitals";
import VitalsTable from "./_components/vitals-table";

const CoreVitals = () => {
    return (
        <div className="grid gap-4">
            <RecordVitals />

            <VitalsTable />
        </div>
    );
};

export default CoreVitals;
