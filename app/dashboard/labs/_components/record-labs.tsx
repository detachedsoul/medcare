"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

const tests = [
	{
		value: "FBC Full Blood Count",
		label: "FBC Full Blood Count",
	},
	{
		value: "U&E Urea & Electrolytes",
		label: "U&E Urea & Electrolytes",
	},
	{
		value: "LFT Liver Function Tests",
		label: "LFT Liver Function Tests",
	},
];

interface Labs {
	id: string;
	participant_code: string;
	patient_name: string;
	click_count: number;
	duration: number;
	date: string;
	location: string;
	clinician_name: string;
	test_name: string;
	task_id: string;
}

const labsSchema = z.object({
	patient_name: z.string().min(2, "Patient name is required"),

    clinician_name: z.string(),

	date: z.string().min(1, "Please enter a date"),
});

type LabsFormData = z.infer<typeof labsSchema>;

const RecordLabs = () => {
	const { code } = useClinicianCode();

	const [isRunning, setIsRunning] = useState(false);
	const [time, setTime] = useState(0);
	const [clickCount, setClickCount] = useState(0);
    const [location, setLocation] = useState("");

    const [open, setOpen] = React.useState(false);
	const [testName, setTestName] = React.useState("");

	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = useForm<LabsFormData>({
		resolver: zodResolver(labsSchema),
		mode: "onChange",
	});

	const handleStartTimer = useCallback(() => {
		if (isRunning) return;

		setIsRunning(true);
		setTime(0);
		setClickCount(0);

		timerRef.current = setInterval(() => {
			setTime((prev) => prev + 1);
		}, 1000);
	}, [isRunning]);

	const handleResetTimer = () => {
		if (timerRef.current) clearInterval(timerRef.current);

		setIsRunning(false);
		setTime(0);
		setClickCount(0);

		reset();
	};

	const {
		mutate: recordLabs,
		isPending,
		isError,
		error,
	} = useSupabaseMutation<Labs>({
		table: "order-labs",
		type: "insert",
		invalidateKey: ["order-labs"],
		onSuccess: () => {
			successToast("Record added successfully.");

			handleResetTimer();

			reset();

            setTestName("");

            setLocation("");
		},
		onError: (error) => {
			errorToast(error.message);
		},
	});

	const onSubmit = async (data: LabsFormData) => {
		if (!isRunning) {
			errorToast("Start the timer before completing the task.");
			return;
		}

		if (timerRef.current) {
			clearInterval(timerRef.current);

			timerRef.current = null;
		}

		setIsRunning(false);

		const payload = {
			...data,
			duration: time,
			click_count: clickCount,
			participant_code: code ?? "",
			task_id: "LABS01",
			location: location,
            test_name: testName
		};

		recordLabs({
			...payload,
		});
    };

	const formatTime = (t: number) => {
		const minutes = Math.floor(t / 60);

		const seconds = t % 60;

		return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
			2,
			"0",
		)}`;
	};

	useEffect(() => {
		if (!isRunning) return;

		const handleClick = () => setClickCount((prev) => prev + 1);

		window.addEventListener("click", handleClick);

		return () => window.removeEventListener("click", handleClick);
	}, [isRunning]);

	return (
		<div className="bg-white p-4 rounded-xl grid gap-6">
			<div className="flex items-center gap-x-4 gap-y-3 justify-between flex-wrap">
				<div>
					<h2 className="font-poppins font-bold text-lg">
						Order Labs
					</h2>
				</div>

				{isRunning ? (
					<div className="bg-green text-white rounded-full py-1 px-4 text-sm">
						{formatTime(time)}
					</div>
				) : (
					<button
						onClick={handleStartTimer}
						className="bg-green text-white rounded-full py-1 px-4 text-sm btn after:rounded-full after:border-green border-green"
						type="button"
					>
						Start Timer
					</button>
				)}
			</div>

			<div className="grid gap-4">
				<form
					className="grid gap-4 items-start md:grid-cols-2 lg:grid-cols-3"
					onSubmit={(e) => handleSubmit(onSubmit)(e)}
				>
					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Clinician Name (Optional)
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="text"
							placeholder="Enter patient's name"
							disabled={!isRunning}
							{...register("clinician_name")}
						/>
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Patient Name
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="text"
							placeholder="Enter patient's name"
							disabled={!isRunning}
							{...register("patient_name")}
						/>

						{errors.patient_name && (
							<p className="text-red text-sm">
								{errors.patient_name.message}
							</p>
						)}
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Test Name
						</span>

						<div>
							<Popover
								open={open}
								onOpenChange={setOpen}
							>
								<PopoverTrigger asChild>
									<button
										className="input w-full text-left md:py-2 rounded-lg"
										type="button"
									>
										{testName
											? tests.find(
													(test) =>
														test.value === testName,
											  )?.label
											: "Select test..."}
									</button>
								</PopoverTrigger>

								<PopoverContent className="p-0">
									<Command>
										<CommandInput
											placeholder="Search test..."
											className="h-9"
										/>
										<CommandList>
											<CommandEmpty>
												No test found.
											</CommandEmpty>

											<CommandGroup>
												{tests.map((test) => (
													<CommandItem
														key={test.value}
														value={test.value}
														onSelect={(
															currentValue,
														) => {
															setTestName(
																currentValue ===
																	testName
																	? ""
																	: currentValue,
															);
															setOpen(false);
														}}
													>
														{test.label}
														<Check
															className={cn(
																"ml-auto",
																testName ===
																	test.value
																	? "opacity-100"
																	: "opacity-0",
															)}
														/>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Lab Location
						</span>

						<div>
                            <Select
                                value={location}
								onValueChange={(selected) =>
									setLocation(selected)
								}
							>
								<SelectTrigger className="w-full input md:py-2 rounded-lg h-full">
									<SelectValue placeholder="Select a lab location" />
								</SelectTrigger>

								<SelectContent>
									<SelectGroup>
										<SelectLabel>Lab Location</SelectLabel>

										<SelectItem value="Local Lab">
											Local Lab
										</SelectItem>

										<SelectItem value="External Lab">
											External Lab
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Date
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="date"
							inputMode="numeric"
							placeholder="Enter heart rate"
							disabled={!isRunning}
							{...register("date")}
						/>

						{errors.date && (
							<p className="text-red text-sm">
								{errors.date.message}
							</p>
						)}
					</label>

					{isError && (
						<p className="text-red font-medium md:col-span-3">
							{error?.message || "Something went wrong"}
						</p>
					)}

					<div className="grid gap-4 md:grid-cols-2 md:col-span-3 mt-4">
						<button
							className="btn"
							type="submit"
							disabled={
								!isRunning ||
								!isValid ||
								isPending ||
								!location ||
								!testName
							}
						>
							{isPending
								? "Recording details..."
								: "Complete Task"}
						</button>

						<button
							onClick={handleResetTimer}
							className="btn bg-red after:border-red border-red"
							type="button"
						>
							Reset Timer
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default RecordLabs;
