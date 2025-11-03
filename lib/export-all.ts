import * as XLSX from "xlsx";
import { errorToast, successToast } from "@/lib/toast";

export type RecordData = Record<string, string | number | boolean>;

export const exportAllToExcel = (
	vitals: RecordData[] | undefined,
	meds: RecordData[] | undefined,
	labs: RecordData[] | undefined,
): void => {
	if (!vitals?.length && !meds?.length && !labs?.length) {
		errorToast("No data available to export.");
		return;
	}

	const workbook = XLSX.utils.book_new();

	const autoFitColumns = (
		data: RecordData[],
		worksheet: XLSX.WorkSheet,
	): void => {
		const objectMaxLength: number[] = [];

		data.forEach((row) => {
			Object.values(row).forEach((value, i) => {
				const cellValue = value == null ? "" : value.toString();
				objectMaxLength[i] = Math.max(
					objectMaxLength[i] || 0,
					cellValue.length,
				);
			});
		});

		worksheet["!cols"] = objectMaxLength.map((width) => ({
			wch: width + 2,
		}));
	};

	if (vitals?.length) {
		const vitalsSheet = XLSX.utils.json_to_sheet(vitals);

		autoFitColumns(vitals, vitalsSheet);

		XLSX.utils.book_append_sheet(workbook, vitalsSheet, "Vitals");
	}

	if (meds?.length) {
		const medsSheet = XLSX.utils.json_to_sheet(meds);

		autoFitColumns(meds, medsSheet);

		XLSX.utils.book_append_sheet(workbook, medsSheet, "Medications");
	}

	if (labs?.length) {
		const labsSheet = XLSX.utils.json_to_sheet(labs);

		autoFitColumns(labs, labsSheet);

		XLSX.utils.book_append_sheet(workbook, labsSheet, "Labs");
	}

	XLSX.writeFile(workbook, "PatientData.xlsx");
	successToast("Record(s) exported successfully.");
};
