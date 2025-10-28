"use client";

import Loading from "@/app/dashboard/loading";
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
import { successToast } from "@/lib/toast";

interface Labs {
	id: string;
	participant_code: string;
	patient_name: string;
	click_count: number;
	duration: number;
	date: string;
	location: string;
	clinician_name: string;
	test_name: string;
	task_id: string;
}

const LabsTable = () => {
	const { code, isLoading } = useClinicianCode();

	const [selected, setSelected] = useState<string[]>([]);

	const { data, error, isFetching } = useQuery<Labs>({
		table: "order-labs",
		filters: [{ column: "participant_code", value: code }],
		enabled: !isLoading,
		key: ["order-labs"],
	});

	const {
		mutate: deleteRecord,
		isPending,
		error: deletionError,
	} = useSupabaseMutation<Labs>({
		table: "order-labs",
		type: "delete",
		invalidateKey: ["order-labs"],
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
			setSelected(data.map((Labs) => Labs.id));
		} else {
			setSelected([]);
		}
	};

	const toggleSelect = (LabsId: string, checked: boolean) => {
		setSelected((prev) =>
			checked ? [...prev, LabsId] : prev.filter((id) => id !== LabsId),
		);
	};

	const handleDelete = async () => {
		deleteRecord({});
	};

	const handleExport = () => {
		alert(`Exporting ${selected.length || "all"} invoice(s) to Excel`);
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
				<h2 className="text-lg font-semibold">Labs</h2>

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

						<TableHead>Patient Name</TableHead>

						<TableHead>Clinician Name</TableHead>

						<TableHead>Task ID</TableHead>

						<TableHead>Number of Clicks</TableHead>

						<TableHead>Duration</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{data?.map((orderLabs) => {
						const isSelected = selected.includes(orderLabs.id);

						return (
							<TableRow
								key={orderLabs.id}
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
												orderLabs.id,
												checked as boolean,
											)
										}
									/>
								</TableCell>

								<TableCell className="font-medium">
									{orderLabs.participant_code}
								</TableCell>

								<TableCell>{orderLabs.patient_name}</TableCell>

								<TableCell>
									{orderLabs.clinician_name?.length > 0
										? orderLabs.clinician_name
										: "N/A"}
								</TableCell>

								<TableCell>{orderLabs.task_id}</TableCell>

								<TableCell>{orderLabs.click_count}</TableCell>

								<TableCell>{orderLabs.duration}</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
};

export default LabsTable;
