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
import { useMemo, useState } from "react";
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
    staff_first_name: string;
    staff_last_name: string;
	age: string;
	drug_strength: string;
	frequency: string;
	is_active: boolean;
	created_at: string;
}

const MedsTable = () => {
	const { code, isLoading } = useClinicianCode();

	const [selected, setSelected] = useState<string[]>([]);
	const [search, setSearch] = useState("");

	const { data, error, isFetching } = useQuery<Meds>({
		table: "reconcile-meds",
		enabled: !isLoading,
		key: ["reconcile-meds"],
	});

	const filteredData = useMemo(() => {
		if (!data) return [];
		if (!search.trim()) return data;

		const q = search.toLowerCase();

		return data.filter((meds) =>
			[
				meds.participant_code,
				meds.patient_id,
				meds.first_name,
				meds.last_name,
				meds.drug_name,
				meds.task_id,
				meds.staff_first_name,
				meds.staff_last_name,
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
	} = useSupabaseMutation<Meds>({
		table: "reconcile-meds",
		type: "delete",
		invalidateKey: ["reconcile-meds"],
		filters: [
			{ column: "id", value: selected },
		],
		onSuccess: () => {
			successToast("Record(s) deleted successfully.");
			setSelected([]);
		},
	});

	const toggleSelectAll = (checked: boolean) => {
		setSelected(checked ? filteredData.map((meds) => meds.id) : []);
	};

	const toggleSelect = (id: string, checked: boolean) => {
		setSelected((prev) =>
			checked ? [...prev, id] : prev.filter((v) => v !== id),
		);
	};

	const handleDelete = () => deleteRecord({});

	const handleExport = () => {
		if (!filteredData.length) {
			errorToast("No records available to export.");
			return;
		}

		const exportData =
			selected.length > 0
				? filteredData.filter((r) => selected.includes(r.id))
				: filteredData;

		const worksheet = XLSX.utils.json_to_sheet(exportData);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, "Meds");
		XLSX.writeFile(workbook, `Meds_${new Date().toISOString()}.xlsx`);

		successToast(`Exported ${exportData.length} record(s).`);

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
				<h2 className="text-lg font-semibold">Meds</h2>

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
                                    onCheckedChange={(v) =>
                                        toggleSelectAll(v as boolean)
                                    }
                                />
                            </TableHead>
                            <TableHead>Participant Code</TableHead>
                            <TableHead>Staff First Name</TableHead>
                            <TableHead>Staff Last Name</TableHead>
                            <TableHead>Patient ID</TableHead>
                            <TableHead>Patient First Name</TableHead>
                            <TableHead>Patient Last Name</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Drug Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredData.map((meds) => (
                            <TableRow key={meds.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selected.includes(meds.id)}
                                        onCheckedChange={(c) =>
                                            toggleSelect(meds.id, c as boolean)
                                        }
                                    />
                                </TableCell>
                                <TableCell>{meds.participant_code}</TableCell>
                                <TableCell>{meds.staff_first_name}</TableCell>
                                <TableCell>{meds.staff_last_name}</TableCell>
                                <TableCell>{meds.patient_id}</TableCell>
                                <TableCell>{meds.first_name}</TableCell>
                                <TableCell>{meds.last_name}</TableCell>
                                <TableCell>{meds.age}</TableCell>
                                <TableCell>{meds.drug_name}</TableCell>
                                <TableCell>
                                    <span
                                        className={cn(
                                            "px-3 py-0.5 rounded-full text-white",
                                            meds.is_active ? "bg-green" : "bg-red",
                                        )}
                                    >
                                        {meds.is_active ? "Active" : "Inactive"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {formatDate(new Date(meds.created_at))}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
		</div>
	);
};

export default MedsTable;
