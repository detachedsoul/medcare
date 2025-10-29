import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(advancedFormat);

function getOrdinalSuffix(day: number): string {
	const suffixes = ["th", "st", "nd", "rd"];
	const v = day % 100;
	return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export function formatDate(
	date?: Date,
	format: string = "ddd, MMM Do YYYY, h:mm A",
	isAdvanced: boolean = false,
): string {
	if (!date) return "";
	const dayjsDate = dayjs(date);

	if (!isAdvanced) {
		return dayjsDate.format(format);
	}

	const dayWithSuffix = getOrdinalSuffix(dayjsDate.date());
	const fullMonthName = dayjsDate.format("MMMM");

	return format
		.replace("DD", dayWithSuffix)
		.replace("MMM", fullMonthName)
		.replace("YYYY", dayjsDate.format("YYYY"))
		.replace("h:mm A", dayjsDate.format("h:mm A"));
}

export function formattedDate(
	date?: Date,
	format: string = "Do, MMM YYYY h:mm A",
	isAdvanced: boolean = true,
): string {
	if (!date) return "";

	const dayjsDate = dayjs(date);

	if (!isAdvanced) {
		return dayjsDate.format(format);
	}

	const dayWithSuffix = getOrdinalSuffix(dayjsDate.date());
	const shortMonthName = dayjsDate.format("MMM");
	const fullYear = dayjsDate.format("YYYY");
	const time = dayjsDate.format("h:mm A");

	return `${dayWithSuffix}, ${shortMonthName} ${fullYear} ${time}`;
}

export const getInitialDate = () => {
	const now = new Date();
	now.setDate(now.getDate() - 7);
	return now;
};
