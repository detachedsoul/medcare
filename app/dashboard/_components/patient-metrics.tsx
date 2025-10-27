import Link from "next/link";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const invoices = [
	{
		invoice: "INV001",
		paymentStatus: "Paid",
		totalAmount: "$250.00",
		paymentMethod: "Credit Card",
	},
	{
		invoice: "INV002",
		paymentStatus: "Pending",
		totalAmount: "$150.00",
		paymentMethod: "PayPal",
	},
	{
		invoice: "INV003",
		paymentStatus: "Unpaid",
		totalAmount: "$350.00",
		paymentMethod: "Bank Transfer",
	},
	{
		invoice: "INV004",
		paymentStatus: "Paid",
		totalAmount: "$450.00",
		paymentMethod: "Credit Card",
	},
	{
		invoice: "INV005",
		paymentStatus: "Paid",
		totalAmount: "$550.00",
		paymentMethod: "PayPal",
	},
	{
		invoice: "INV006",
		paymentStatus: "Pending",
		totalAmount: "$200.00",
		paymentMethod: "Bank Transfer",
	},
	{
		invoice: "INV007",
		paymentStatus: "Unpaid",
		totalAmount: "$300.00",
		paymentMethod: "Credit Card",
	},
];

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
			</div>
		</div>
	);
};

export default PatientMetrics;
