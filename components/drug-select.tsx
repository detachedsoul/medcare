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
import { Drugs } from "@/lib/drugs";

interface DrugSelectProps {
	value?: string | null;
	onSelect: (drug: string) => void;
	placeholder?: string;
}

const DrugSelect = ({
	value,
	onSelect,
	placeholder = "Select drug",
}: DrugSelectProps) => {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="input w-full text-left rounded-lg md:py-2"
				>
					{value ?? placeholder}
				</button>
			</PopoverTrigger>

			<PopoverContent className="p-0 z-50000">
				<Command className="max-h-60">
					<CommandInput placeholder="Search drug..." />
					<CommandEmpty>No drug found.</CommandEmpty>

					<CommandGroup className="overflow-y-auto">
						{Drugs.map((drug) => (
							<CommandItem
								key={drug}
								value={drug}
								onSelect={() => {
									onSelect(drug);
									setOpen(false);
								}}
							>
								{drug}
								<CheckIcon
									className={cn(
										"ml-auto h-4 w-4",
										value === drug ? "opacity-100" : "opacity-0",
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

export default DrugSelect;
