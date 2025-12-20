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
import { useState, useMemo } from "react";
import { TrashIcon, DownloadIcon } from "lucide-react";
import { useQuery } from "@/hooks/use-query";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { formatDate } from "@/lib/format-date";

interface Vitals {
	id: string;
	staff_id: string;
	patient_id: string;
	blood_pressure: string;
	heart_rate: number;
	first_name: string;
	last_name: string;
	age: string;
	temperature: string;
	weight: string;
	task_id: string;
	click_count: number;
	error_count: number;
	created_at: number;
}

const VitalsTable = () => {
	const { code, isLoading } = useClinicianCode();

	const [selected, setSelected] = useState<string[]>([]);
	const [search, setSearch] = useState("");

	const { data, error, isFetching } = useQuery<Vitals>({
		table: "vitals",
		filters: [{ column: "staff_id", value: code }],
		enabled: !isLoading,
		key: ["vitals"],
	});

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!search.trim()) return data;

		const q = search.toLowerCase();

		return data.filter((vitals) =>
			[
				vitals.staff_id,
				vitals.patient_id,
				vitals.first_name,
				vitals.last_name,
				vitals.task_id,
			]
				.join(" ")
				.toLowerCase()
				.includes(q),
		);
	}, [data, search]);

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
		},
	});

	const toggleSelectAll = (checked: boolean) => {
		if (!filteredData.length) {
			setSelected([]);
			return;
		}

		setSelected(checked ? filteredData.map((vitals) => vitals.id) : []);
	};

	const toggleSelect = (id: string, checked: boolean) => {
		setSelected((prev) =>
			checked ? [...prev, id] : prev.filter((x) => x !== id),
		);
	};

	const handleDelete = () => {
		deleteRecord({});
	};

	const handleExport = () => {
		if (!filteredData.length) {
			errorToast("No records available to export.");
			return;
		}

		const exportData =
			selected.length > 0
				? filteredData.filter((r) => selected.includes(r.id))
				: filteredData;

		const formatted = exportData.map((row) => ({
			"ID": row.id,
			"Participant Code": row.staff_id,
			"Patient ID": row.patient_id,
			"First Name": row.first_name,
			"Last Name": row.last_name,
			"Age": row.age,
			"Blood Pressure": row.blood_pressure,
			"Heart Rate": row.heart_rate,
			"Temperature": `${row.temperature} °C`,
			"Weight": `${row.weight}kg`,
			"Task ID": row.task_id,
			"Number of Clicks": row.click_count,
		}));

		const worksheet = XLSX.utils.json_to_sheet(formatted);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, "Vitals");
		XLSX.writeFile(workbook, `Vitals_${new Date().toISOString()}.xlsx`);

		successToast(`Exported ${exportData.length} record(s) successfully.`);

        setSelected([]);
	};

	if (isFetching || isPending) return <Loading />;

    if (!search && data && data.length < 1) {
		return (
			<div className="h-[50dvh] grid place-content-center text-center bg-white p-4 rounded-xl">
				{" "}
				<p className="text-red font-medium">
					{" "}
					There are no records at this time. Please check back later.{" "}
				</p>{" "}
			</div>
		);
	}

	return (
		<div className="overflow-x-auto bg-white p-4 rounded-xl space-y-4">
			<div className="flex flex-wrap gap-4 items-center justify-between">
				<h2 className="text-lg font-semibold">Recorded Vitals</h2>

				<input
					className="input max-w-xs py-2"
					placeholder="Search by name, patient ID, task ID…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>

				<div className="flex items-center gap-4">
					<button
						className="flex items-center gap-1 text-red disabled:text-gray-300"
						type="button"
						disabled={!selected.length}
						onClick={handleDelete}
					>
						<TrashIcon className="w-4 h-4" /> Delete
					</button>

					<button
						className="flex items-center gap-1 text-blue"
						type="button"
						onClick={handleExport}
					>
						<DownloadIcon className="w-4 h-4" /> Export
					</button>
				</div>
			</div>

			{(error || deletionError) && (
				<p className="text-red font-medium">
					{error?.message || deletionError?.message}
				</p>
			)}

            {filteredData.length < 1 && (
                <div className="h-[50dvh] grid gap-4 place-content-center text-center bg-white rounded-xl">
                    <p className="text-red font-medium">
                        No record matches your search.
                    </p>

                    <button
                        className="btn py-2"
                        type="button"
                        onClick={() => setSearch("")}
                    >
                        Clear Search
                    </button>
                </div>
            )}

            {filteredData.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Checkbox
                                    checked={
                                        selected.length === filteredData.length
                                    }
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
                            <TableHead>Task ID</TableHead>
                            <TableHead>Blood Pressure</TableHead>
                            <TableHead>Heart Rate</TableHead>
                            <TableHead>Temperature</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>Errors</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredData.map((vitals) => {
                            const isSelected = selected.includes(vitals.id);

                            return (
                                <TableRow
                                    key={vitals.id}
                                    className={
                                        isSelected
                                            ? "bg-gray-50"
                                            : "hover:bg-gray-50/50"
                                    }
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
                                    <TableCell>{vitals.staff_id}</TableCell>
                                    <TableCell>{vitals.patient_id}</TableCell>
                                    <TableCell>{vitals.first_name}</TableCell>
                                    <TableCell>{vitals.last_name}</TableCell>
                                    <TableCell>{vitals.age}</TableCell>
                                    <TableCell>{vitals.task_id}</TableCell>
                                    <TableCell>{vitals.blood_pressure}</TableCell>
                                    <TableCell>{vitals.heart_rate}</TableCell>
                                    <TableCell>{vitals.temperature} °C</TableCell>
                                    <TableCell>{vitals.weight}kg</TableCell>
                                    <TableCell>{vitals.click_count}</TableCell>
                                    <TableCell>{vitals.error_count}</TableCell>
                                    <TableCell>
                                        {formatDate(new Date(vitals.created_at))}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}
		</div>
	);
};

export default VitalsTable;
