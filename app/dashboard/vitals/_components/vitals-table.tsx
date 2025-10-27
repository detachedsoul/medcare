"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { TrashIcon, DownloadIcon } from "lucide-react";

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

const VitalsTable = () => {
	const [selected, setSelected] = useState<string[]>([]);

	const toggleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelected(invoices.map((i) => i.invoice));
		} else {
			setSelected([]);
		}
	};

	const toggleSelect = (invoiceId: string, checked: boolean) => {
		setSelected((prev) =>
			checked
				? [...prev, invoiceId]
				: prev.filter((id) => id !== invoiceId),
		);
	};

	const handleDelete = () => {
		alert(`Deleting invoices: ${selected.join(", ")}`);
	};

	const handleExport = () => {
		alert(`Exporting ${selected.length || "all"} invoice(s) to Excel`);
	};

	return (
		<div className="overflow-x-auto bg-white p-4 rounded-xl space-y-4">
			<div className="flex gap-4 flex-wrap items-center justify-between">
				<h2 className="text-lg font-semibold">Invoices</h2>

				<div className="flex items-center gap-2">
					<button
						className="flex items-center gap-1 text-red disabled:text-gray-300"
						type="button"
						disabled={selected.length === 0}
						onClick={handleDelete}
					>
						<TrashIcon className="w-4 h-4" /> Delete
					</button>

					<button
						className="flex items-center gap-1 text-blue"
						type="button"
						onClick={handleExport}
					>
						<DownloadIcon className="w-4 h-4" /> Export to Excel
					</button>
				</div>
			</div>

			{/* Table */}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Checkbox
								checked={selected.length === invoices.length}
								onCheckedChange={(checked) =>
									toggleSelectAll(checked as boolean)
								}
							/>
						</TableHead>

						<TableHead>Invoice</TableHead>

						<TableHead>Status</TableHead>

						<TableHead>Method</TableHead>

						<TableHead>Amount</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{invoices.map((invoice) => {
						const isSelected = selected.includes(invoice.invoice);
						return (
							<TableRow
								key={invoice.invoice}
								className={`transition-colors ${
									isSelected
										? "bg-gray-50"
										: "hover:bg-gray-50/50"
								}`}
							>
								<TableCell>
									<Checkbox
										checked={isSelected}
										onCheckedChange={(checked) =>
											toggleSelect(
												invoice.invoice,
												checked as boolean,
											)
										}
									/>
								</TableCell>

								<TableCell className="font-medium">
									{invoice.invoice}
								</TableCell>

								<TableCell>{invoice.paymentStatus}</TableCell>

								<TableCell>{invoice.paymentMethod}</TableCell>

								<TableCell>{invoice.totalAmount}</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
};

export default VitalsTable;
