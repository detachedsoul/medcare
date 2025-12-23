"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Patient } from "@/lib/patients";
import { useQuery } from "@/hooks/use-query";

interface PatientSelectProps {
	patients: Patient[];
	onSelect: (patient: Patient | "new") => void;
	value?: Patient | null;
	onAddNew?: () => void;
}

interface DBPatient {
	id: string;
	patient_id: string;
	first_name: string;
	last_name: string;
	age: string;
	date_of_birth?: string;
	gender?: string;
	phone?: string;
}

const PatientSelect = ({ patients, onSelect, value }: PatientSelectProps) => {
	const [open, setOpen] = React.useState(false);

	const { data: dbPatients = [], isLoading } = useQuery<DBPatient>({
		table: "patients",
		key: ["patients"],
		enabled: true,
	});

	const convertedDbPatients: Patient[] = React.useMemo(() => {
		return dbPatients.map((patient) => ({
			id: patient.patient_id,
			first_name: patient.first_name,
			last_name: patient.last_name,
			age: patient.age,
		}));
	}, [dbPatients]);

	const allPatients = React.useMemo(() => {
		const patientMap = new Map<string, Patient>();

		convertedDbPatients.forEach((patient) => {
			patientMap.set(patient.id, patient);
		});

		patients.forEach((patient) => {
			if (!patientMap.has(patient.id)) {
				patientMap.set(patient.id, patient);
			}
		});

		return Array.from(patientMap.values());
	}, [convertedDbPatients, patients]);

	return (
		<Popover
			open={open}
			onOpenChange={() => {
				if (isLoading) return;

				setOpen(!open);
			}}
		>
			<PopoverTrigger asChild>
				<button
					className="input w-full text-left md:py-2 rounded-lg"
					type="button"
				>
					{value
						? `${value.first_name} ${value.last_name} (${value.age})`
						: isLoading
						? "Loading patients..."
						: "Select patient"}
				</button>
			</PopoverTrigger>

			<PopoverContent className="p-0 z-50000">
				<Command className="max-h-60 z-50000">
					<CommandInput placeholder="Search patient..." />

					<CommandEmpty>No patient found.</CommandEmpty>

					<button
						className="w-full text-left px-3 py-2 text-blue-600 font-semibold hover:bg-blue-50 border-b"
						onClick={() => {
							onSelect("new");
							setOpen(false);
						}}
						type="button"
					>
						+ Add New Patient
					</button>

					<CommandGroup className="overflow-y-auto">
						{isLoading ? (
							<div className="px-3 py-2 text-sm text-gray-500">
								Loading patients...
							</div>
						) : allPatients.length === 0 ? (
							<div className="px-3 py-2 text-sm text-gray-500">
								No patients available
							</div>
						) : (
							allPatients.map((patient) => (
								<CommandItem
									key={`${patient.id}+${patient.age}+${patient.first_name}+${patient.last_name}`}
									value={`${patient.first_name} ${patient.last_name}`}
									onSelect={() => {
										onSelect(patient);
										setOpen(false);
									}}
								>
									{patient.first_name} {patient.last_name} —{" "}
									{patient.age}
									&nbsp; years
									<CheckIcon
										className={cn(
											"ml-auto h-4 w-4",
											value?.id === patient.id
												? "opacity-100"
												: "opacity-0",
										)}
									/>
								</CommandItem>
							))
						)}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default PatientSelect;
