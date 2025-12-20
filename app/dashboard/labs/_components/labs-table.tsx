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
import { formatDate } from "@/lib/format-date";

interface Labs {
	id: string;
	participant_code: string;
	patient_id: string;
	first_name: string;
	last_name: string;
	age: string;
	click_count: number;
	error_count: number;
	date: string;
	location: string;
	test_name: string;
	task_id: string;
	created_at: string;
}

const LabsTable = () => {
	const { code, isLoading } = useClinicianCode();

	const [selected, setSelected] = useState<string[]>([]);
	const [search, setSearch] = useState("");

	const { data, error, isFetching } = useQuery<Labs>({
		table: "order-labs",
		filters: [{ column: "participant_code", value: code }],
		enabled: !isLoading,
		key: ["order-labs"],
	});

	const filteredLabs = useMemo(() => {
		if (!data) return [];
		if (!search.trim()) return data;

		const query = search.toLowerCase();

		return data.filter((labsRecord) =>
			[
				labsRecord.participant_code,
				labsRecord.patient_id,
				labsRecord.first_name,
				labsRecord.last_name,
				labsRecord.test_name,
				labsRecord.location,
				labsRecord.task_id,
			]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [data, search]);

	const {
		mutate: deleteRecords,
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
		setSelected(
			checked ? filteredLabs.map((labsRecord) => labsRecord.id) : [],
		);
	};

	const toggleSelect = (recordId: string, checked: boolean) => {
		setSelected((previous) =>
			checked
				? [...previous, recordId]
				: previous.filter((id) => id !== recordId),
		);
	};

	const handleDelete = () => {
		deleteRecords({});
	};

	const handleExport = () => {
		if (!filteredLabs.length) {
			errorToast("No records available to export.");
			return;
		}

		const exportRows =
			selected.length > 0
				? filteredLabs.filter((row) => selected.includes(row.id))
				: filteredLabs;

		const formatted = exportRows.map((row) => ({
			"ID": row.id,
			"Participant Code": row.participant_code,
			"Patient ID": row.patient_id,
			"First Name": row.first_name,
			"Last Name": row.last_name,
			"Age": row.age,
			"Test Name": row.test_name,
			"Location": row.location,
			"Task ID": row.task_id,
			"Number of Clicks": row.click_count,
		}));

		const worksheet = XLSX.utils.json_to_sheet(formatted);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, "Labs");
		XLSX.writeFile(workbook, `Labs_${new Date().toISOString()}.xlsx`);

		successToast(`Exported ${exportRows.length} record(s) successfully.`);

        setSelected([]);
	};

	if (isFetching || isPending) {
		return <Loading />;
	}

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
				<h2 className="text-lg font-semibold">Labs</h2>

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

            {filteredLabs.length < 1 && (
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

            {filteredLabs.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Checkbox
                                    checked={
                                        selected.length === filteredLabs.length
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
                            <TableHead>Test Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Task ID</TableHead>
                            <TableHead>Number of Clicks</TableHead>
                            <TableHead>Error Count</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredLabs.map((labsRecord) => {
                            const isSelected = selected.includes(labsRecord.id);

                            return (
                                <TableRow
                                    key={labsRecord.id}
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
                                                    labsRecord.id,
                                                    checked as boolean,
                                                )
                                            }
                                        />
                                    </TableCell>

                                    <TableCell className="font-medium">
                                        {labsRecord.participant_code}
                                    </TableCell>
                                    <TableCell>{labsRecord.patient_id}</TableCell>
                                    <TableCell>{labsRecord.first_name}</TableCell>
                                    <TableCell>{labsRecord.last_name}</TableCell>
                                    <TableCell>{labsRecord.age}</TableCell>
                                    <TableCell>{labsRecord.test_name}</TableCell>
                                    <TableCell>{labsRecord.location}</TableCell>
                                    <TableCell>{labsRecord.task_id}</TableCell>
                                    <TableCell>{labsRecord.click_count}</TableCell>
                                    <TableCell>{labsRecord.error_count}</TableCell>
                                    <TableCell>
                                        {formatDate(
                                            new Date(labsRecord.created_at),
                                        )}
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

export default LabsTable;
