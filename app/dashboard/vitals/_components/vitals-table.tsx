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

interface Vitals {
	id: string;
	staff_id: string;
	patient_name: string;
	blood_pressure: string;
	heart_rate: number;
	temperature: string;
	weight: string;
	clinician_name: string;
	task_id: string;
	duration: number;
	click_count: number;
}

const VitalsTable = () => {
	const { code, isLoading } = useClinicianCode();

	const [selected, setSelected] = useState<string[]>([]);

	const { data, error, isFetching } = useQuery<Vitals>({
		table: "vitals",
		filters: [{ column: "staff_id", value: code }],
		enabled: !isLoading,
		key: ["vitals"],
	});

	const {
		mutate: deleteRecord,
		isPending,
		error: deletionError,
	} = useSupabaseMutation<Vitals>({
		table: "vitals",
		type: "delete",
		invalidateKey: ["vitals"],
		filters: [
			{ column: "staff_id", value: code },
			{ column: "id", value: selected },
		],
		onSuccess: () => {
			successToast("Record(s) deleted successfully.");

			setSelected([]);
		}
	});

	const toggleSelectAll = (checked: boolean) => {
		if (!data) {
			setSelected([]);

			return;
		}

		if (checked) {
			setSelected(data.map((vitals) => vitals.id));
		} else {
			setSelected([]);
		}
	};

	const toggleSelect = (vitalsId: string, checked: boolean) => {
		setSelected((prev) =>
			checked
				? [...prev, vitalsId]
				: prev.filter((id) => id !== vitalsId),
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
					There are no recorded vitals now. Please check back later.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto bg-white p-4 rounded-xl space-y-4">
			<div className="flex gap-4 flex-wrap items-center justify-between">
				<h2 className="text-lg font-semibold">Recorded Vitals</h2>

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

						<TableHead>Patient Name</TableHead>

						<TableHead>Clinician Name</TableHead>

						<TableHead>Task ID</TableHead>

						<TableHead>Blood Pressure</TableHead>

						<TableHead>Heart Rate</TableHead>

						<TableHead>Temperature</TableHead>

						<TableHead>Weight</TableHead>

						<TableHead>Number of Clicks</TableHead>

						<TableHead>Duration</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{data?.map((vitals) => {
						const isSelected = selected.includes(vitals.id);

						return (
							<TableRow
								key={vitals.id}
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
												vitals.id,
												checked as boolean,
											)
										}
									/>
								</TableCell>

								<TableCell className="font-medium">
									{vitals.patient_name}
								</TableCell>

								<TableCell>
									{vitals.clinician_name?.length > 0
										? vitals.clinician_name
										: "N/A"}
								</TableCell>

								<TableCell>{vitals.task_id}</TableCell>

								<TableCell>{vitals.blood_pressure}</TableCell>

								<TableCell>{vitals.heart_rate}</TableCell>

								<TableCell>{vitals.temperature} °C</TableCell>

								<TableCell>{vitals.weight}</TableCell>

								<TableCell>{vitals.click_count}</TableCell>

								<TableCell>{vitals.duration}</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
};

export default VitalsTable;
