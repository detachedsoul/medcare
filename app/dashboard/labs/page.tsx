import LabsTable from "./_components/labs-table";
import RecordLabs from "./_components/record-labs";

const Labs = () => {
	return (
		<div className="grid gap-4">
			<RecordLabs />

			<LabsTable />
		</div>
	);
};

export default Labs;
