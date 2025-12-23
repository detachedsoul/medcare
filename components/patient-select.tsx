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

interface PatientSelectProps {
	patients: Patient[];
	onSelect: (patient: Patient | "new") => void;
	value?: Patient | null;
	onAddNew?: () => void;
}
const PatientSelect = ({ patients, onSelect, value }: PatientSelectProps) => {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover
			open={open}
			onOpenChange={setOpen}
		>
			<PopoverTrigger asChild>
				<button
					className="input w-full text-left md:py-2 rounded-lg"
					type="button"
				>
					{value
						? `${value.first_name} ${value.last_name} (${value.age})`
						: "Select patient"}
				</button>
			</PopoverTrigger>

			<PopoverContent className="p-0 z-50000">
				<Command className="max-h-60 z-50000">
					<CommandInput placeholder="Search patient..." />
					<CommandEmpty>No patient found.</CommandEmpty>

					<button
						className="w-full text-left px-3 py-2 text-blue-600 font-semibold hover:bg-blue-50"
                        onClick={() => {
                            onSelect("new");

                            setOpen(false);
                        }}
                        type="button"
					>
						+ Add New Patient
					</button>

					<CommandGroup className="overflow-y-auto">
						{patients.map((patient) => (
							<CommandItem
								key={patient.id}
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
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default PatientSelect;
