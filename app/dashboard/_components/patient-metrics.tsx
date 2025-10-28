import VitalsTable from "../vitals/_components/vitals-table";
import LabsTable from "../labs/_components/labs-table";
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
			</Tabs>

			{/* <div className="overflow-x-auto">
				<Table>
                    <TableCaption>A list of your recent invoices.</TableCaption>

					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px]">Invoice</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Method</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
                    </TableHeader>

					<TableBody>
						{invoices.map((invoice) => (
							<TableRow key={invoice.invoice}>
								<TableCell className="font-medium">
									{invoice.invoice}
								</TableCell>

								<TableCell>{invoice.paymentStatus}</TableCell>

								<TableCell>{invoice.paymentMethod}</TableCell>

								<TableCell className="text-right">
									{invoice.totalAmount}
								</TableCell>
							</TableRow>
						))}
                    </TableBody>

					<TableFooter>
						<TableRow>
							<TableCell colSpan={3}>Total</TableCell>
							<TableCell className="text-right">
								$2,500.00
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>

				<div className="h-[80dvh] grid place-content-center text-center p-4">
					You don’t have a patient yet. Get started by{" "}
					<Link
						className="text-blue hover:underline hover:decoration-blue hover:decoration-double underline-offset-5 font-medium"
						href="/dashboard/vitals"
					>
						recording a patient’s core vital,
					</Link>{" "}
					<Link
						className="text-blue hover:underline hover:decoration-blue hover:decoration-double underline-offset-5 font-medium"
						href="/dashboard/labs"
					>
						order labs,
					</Link>{" "}
					<Link
						className="text-blue hover:underline hover:decoration-blue hover:decoration-double underline-offset-5 font-medium"
						href="/dashboard/meds"
					>
						or reconcile meds.
					</Link>
				</div>
			</div> */}
		</div>
	);
};

export default PatientMetrics;
