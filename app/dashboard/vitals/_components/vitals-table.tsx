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

interface Vitals {
	id: string;
	staff_id: string;
	patient_name: string;
	blood_pressure: string;
	heart_rate: number;
	temperature: string;
	weight: string;
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

	const handleDelete = () => {
		alert(`Deleting invoices: ${selected.join(", ")}`);
	};

	const handleExport = () => {
		alert(`Exporting ${selected.length || "all"} invoice(s) to Excel`);
    };

    if (isFetching) {
		return <Loading />;
	}

    if (error) {
        return (
			<div className="h-[80dvh] grid place-content-center text-center p-4">
				<p className="text-red font-medium">
					{error.message}
				</p>
			</div>
		);
    }

    if (data && data?.length < 1) {
        return (
			<div className="h-[80dvh] grid place-content-center text-center p-4">
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
