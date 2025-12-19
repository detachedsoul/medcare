import LabsTable from "./labs-table";
import MedsTable from "./meds-table";
import VitalsTable from "./vitals-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PatientMetrics = () => {
	return (
		<div className="bg-white p-4 rounded-xl grid gap-4">
			<div>
				<h2 className="font-poppins font-bold text-lg">
					Patient Metrics
				</h2>

				<p className="text-sm">Information about your patients</p>
			</div>

			<div className="overflow-x-auto">
				<Tabs
					defaultValue="vitals"
					className="w-full"
				>
					<TabsList>
						<TabsTrigger value="vitals">Vitals</TabsTrigger>
						<TabsTrigger value="labs">Order Labs</TabsTrigger>
						<TabsTrigger value="meds">Reconcile Meds</TabsTrigger>
					</TabsList>

					<TabsContent value="vitals">
						<VitalsTable />
					</TabsContent>

					<TabsContent value="labs">
						<LabsTable />
					</TabsContent>

					<TabsContent value="meds">
						<MedsTable />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
};

export default PatientMetrics;
