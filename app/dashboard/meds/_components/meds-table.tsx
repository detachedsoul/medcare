"use client";

import Loading from "@/app/dashboard/loading";
import * as XLSX from "xlsx";
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
import { useQuery } from "@/hooks/use-query";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format-date";

interface Meds {
	id: string;
	participant_code: string;
	patient_id: string;
	click_count: number;
	error_count: number;
	task_id: string;
	drug_name: string;
	first_name: string;
	last_name: string;
	age: string;
	drug_strength: string;
	frequency: string;
	is_active: boolean;
	created_at: string;
}

const MedsTable = () => {
	const { code, isLoading } = useClinicianCode();

	const [selected, setSelected] = useState<string[]>([]);

	const { data, error, isFetching } = useQuery<Meds>({
		table: "reconcile-meds",
		filters: [{ column: "participant_code", value: code }],
		enabled: !isLoading,
		key: ["reconcile-meds"],
	});

	const {
		mutate: deleteRecord,
		isPending,
		error: deletionError,
	} = useSupabaseMutation<Meds>({
		table: "reconcile-meds",
		type: "delete",
		invalidateKey: ["reconcile-meds"],
		filters: [
			{ column: "participant_code", value: code },
			{ column: "id", value: selected },
		],
		onSuccess: () => {
			successToast("Record(s) deleted successfully.");

			setSelected([]);
		},
	});

	const toggleSelectAll = (checked: boolean) => {
		if (!data) {
			setSelected([]);

			return;
		}

		if (checked) {
			setSelected(data.map((Meds) => Meds.id));
		} else {
			setSelected([]);
		}
	};

	const toggleSelect = (MedsId: string, checked: boolean) => {
		setSelected((prev) =>
			checked ? [...prev, MedsId] : prev.filter((id) => id !== MedsId),
		);
	};

	const handleDelete = async () => {
		deleteRecord({});
	};

	const handleExport = () => {
		if (!data || data.length === 0) {
			errorToast("No records available to export.");

			return;
		}

		const exportData =
			selected.length > 0
				? data.filter((row) => selected.includes(row.id))
				: data;

		const formatted = exportData.map((row) => ({
			"ID": row.id,
			"Participant Code": row.participant_code,
			"Patient ID": row.patient_id,
			"First Name": row.first_name,
			"Last Name": row.last_name,
			"Age": row.age,
			"Drug Name": row.drug_name,
			"Drug Quantity": row.drug_strength,
			"Frequency": row.frequency,
			"Status": row.is_active ? "Active" : "Inactive",
			"Task ID": row.task_id,
			"Number of Clicks": row.click_count,
		}));

        const worksheet = XLSX.utils.json_to_sheet(formatted);
		XLSX.utils.sheet_add_aoa(worksheet, [["Meds Records Export"]], {
			origin: "A1",
		});

		XLSX.utils.sheet_add_json(worksheet, formatted, {
			origin: "A2",
			skipHeader: false,
		});


		XLSX.utils.sheet_add_aoa(worksheet, [["Meds Records Export"]], {
			origin: "A1",
		});

		const columnCount = Object.keys(formatted[0]).length;
		worksheet["!merges"] = [
			{ s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
		];

		worksheet["A1"].s = {
			font: { bold: true, sz: 16 },
			alignment: { horizontal: "center" },
		};

        for (let c = 0; c < columnCount; c++) {
			const cellAddr = XLSX.utils.encode_cell({ r: 1, c });
            const cell = worksheet[cellAddr];

			if (cell) {
				cell.s = {
					font: { bold: true, color: { rgb: "FFFFFF" } },
					fill: { fgColor: { rgb: "4472C4" } },
					alignment: { horizontal: "center" },
				};
			}
		}

		const colWidths = Object.keys(formatted[0]).map((key) => {
			const maxLength = Math.max(
				key.length,
				...formatted.map((row) =>
					row[key as keyof typeof row] ? String(row[key as keyof typeof row]).length : 0,
				),
			);
			return { wch: maxLength + 2 };
		});
		worksheet["!cols"] = colWidths;

		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Meds");

		XLSX.writeFile(workbook, `Meds_${new Date().toISOString()}.xlsx`);

		successToast(
			`Exported ${
				selected.length || data.length
			} record(s) successfully.`,
		);
	};

	if (isFetching || isPending) {
		return <Loading />;
	}

	if (data && data?.length < 1) {
		return (
			<div className="h-[50dvh] grid place-content-center text-center bg-white p-4 rounded-xl">
				<p className="text-red font-medium">
					There are no records at this time. Please check back later.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto bg-white p-4 rounded-xl space-y-4">
			<div className="flex gap-4 flex-wrap items-center justify-between">
				<h2 className="text-lg font-semibold">Meds</h2>

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

			{(error || deletionError) && (
				<p className="text-red font-medium">
					{error?.message || deletionError?.message}
				</p>
			)}

			{/* Table */}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Checkbox
								checked={selected.length === data?.length}
								onCheckedChange={(checked) =>
									toggleSelectAll(checked as boolean)
								}
							/>
						</TableHead>

						<TableHead>Participant Code</TableHead>

						<TableHead>Patient ID</TableHead>

                        <TableHead>First Name</TableHead>
						<TableHead>Last Name</TableHead>
						<TableHead>Age</TableHead>

						<TableHead>Drug Name</TableHead>

						<TableHead>Drug Quantity</TableHead>

						<TableHead>Frequency</TableHead>

						<TableHead>Status</TableHead>

						<TableHead>Task ID</TableHead>

                        <TableHead>Number of Clicks</TableHead>

						<TableHead>Error Count</TableHead>

						<TableHead>Date</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{data?.map((meds) => {
						const isSelected = selected.includes(meds.id);

						return (
							<TableRow
								key={meds.id}
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
												meds.id,
												checked as boolean,
											)
										}
									/>
								</TableCell>

								<TableCell className="font-medium">
									{meds.participant_code}
								</TableCell>

								<TableCell>{meds.patient_id}</TableCell>

								<TableCell>{meds.first_name}</TableCell>
								<TableCell>{meds.last_name}</TableCell>
								<TableCell>{meds.age}</TableCell>

								<TableCell>{meds.drug_name}</TableCell>

								<TableCell>{meds.drug_strength}</TableCell>

								<TableCell>{meds.frequency}</TableCell>

								<TableCell>
									<span
										className={cn(
											"py-0.5 px-3 rounded-full h-auto",
											{
												"bg-green text-white":
													meds.is_active,
												"bg-red text-white":
													!meds.is_active,
											},
										)}
									>
										{meds.is_active ? "Active" : "Inactive"}
									</span>
								</TableCell>

								<TableCell>{meds.task_id}</TableCell>

								<TableCell>{meds.click_count}</TableCell>

								<TableCell>{meds.error_count}</TableCell>

								<TableCell>
									{formatDate(new Date(meds.created_at))}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
};

export default MedsTable;
