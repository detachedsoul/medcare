import MedicationListing from "./_components/medication-list";
import MedsTable from "./_components/meds-table";
import RecordMeds from "./_components/record-meds";

const Meds = () => {
	return (
		<div className="grid gap-4">
			<RecordMeds />

            <MedicationListing />

            <MedsTable />
		</div>
	);
};

export default Meds;
