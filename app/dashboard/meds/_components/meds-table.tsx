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
import { cn } from "@/lib/utils";

interface Meds {
	id: string;
	participant_code: string;
	patient_name: string;
	click_count: number;
	duration: number;
	clinician_name: string;
	task_id: string;
	drug_name: string;
	drug_strength: string;
	frequency: string;
	is_active: boolean;
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

						<TableHead>Patient Name</TableHead>

						<TableHead>Clinician Name</TableHead>

						<TableHead>Drug Name</TableHead>

						<TableHead>Drug Quantity</TableHead>

						<TableHead>Frequency</TableHead>

						<TableHead>Status</TableHead>

						<TableHead>Task ID</TableHead>

						<TableHead>Number of Clicks</TableHead>

						<TableHead>Duration</TableHead>
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

								<TableCell>{meds.patient_name}</TableCell>

								<TableCell>
									{meds.clinician_name?.length > 0
										? meds.clinician_name
										: "N/A"}
								</TableCell>

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

								<TableCell>{meds.duration}</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
};

export default MedsTable;
