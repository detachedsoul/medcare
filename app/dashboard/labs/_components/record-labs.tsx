/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import PatientSelect from "@/components/patient-select";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import { generateUniqueCode } from "@/lib/generate-unique-code";
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
import { Patient, patients } from "@/lib/patients";

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
}

interface FormErrorItem {
	message?: string;
	[key: string]: any;
}

interface FormErrorsMap {
	[key: string]: FormErrorItem | undefined;
}

interface NewLabsPayload {
	patient_id: string;
	participant_code: string;
	first_name: string;
	last_name: string;
	age: string;
	click_count: number;
	error_count: number;
	date: string;
	location: string;
	test_name: string;
	task_id: string;
	[key: string]: any;
}

interface NewPatient {
	id: string;
	first_name: string;
	last_name: string;
	age: string;
}

const labsSchema = z.object({
	first_name: z.string().min(1, "Please enter first name"),
	last_name: z.string().min(1, "Please enter last name"),
	age: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Please enter age"),
	date: z
		.string()
		.min(1, "Please enter a date")
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
		.refine((date) => {
			const selectedDate = new Date(date);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			return selectedDate >= today;
		}, "Date cannot be in the past"),
});

type LabsFormData = z.infer<typeof labsSchema>;

const RecordLabs = () => {
	const { code } = useClinicianCode();

    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const [showNewPatientModal, setShowNewPatientModal] = useState(false);

	const [newPatientData, setNewPatientData] = useState({
		first_name: "",
		last_name: "",
		age: "",
	});

	const [clickCount, setClickCount] = useState<number>(0);
	const [errorCount, setErrorCount] = useState<number>(0);
	const [isCounting, setIsCounting] = useState<boolean>(false);
	const [location, setLocation] = useState("");
	const [open, setOpen] = React.useState(false);
	const [testName, setTestName] = React.useState("");

	const clickHandlerRef = useRef<(e: MouseEvent) => void>(() => {});
	const firstRunRef = useRef(true);
	const prevErrorsRef = useRef<Set<string>>(new Set());

	const {
		register,
		handleSubmit,
        reset,
        setValue,
		formState: { errors, isValid },
	} = useForm<LabsFormData>({
		resolver: async (data, context, options) => {
			const result = await zodResolver(labsSchema)(data, context, options);

			if (firstRunRef.current) {
				firstRunRef.current = false;
				return result;
			}

			const currentErrorMessages = Object.values(result.errors)
				.map((err) => err?.message)
				.filter(Boolean) as string[];

			currentErrorMessages.forEach((msg) => {
				if (!prevErrorsRef.current.has(msg)) {
					prevErrorsRef.current.add(msg);
					setErrorCount((prev) => prev + 1);
				}
			});

			prevErrorsRef.current.forEach((msg) => {
				if (!currentErrorMessages.includes(msg)) {
					prevErrorsRef.current.delete(msg);
				}
			});

			return result;
		},
		mode: "all",
	});

	useEffect(() => {
		clickHandlerRef.current = () => setClickCount((c) => c + 1);

		if (isCounting) {
			window.addEventListener("click", clickHandlerRef.current);
		}

		return () => {
			window.removeEventListener("click", clickHandlerRef.current);
		};
	}, [isCounting]);

	const onInvalid = async (formErrors: FormErrorsMap): Promise<void> => {
		const errorList = Object.values(formErrors)
			.map((err: FormErrorItem | undefined) => `• ${err?.message}`)
			.join("<br/>");

		try {
			await fetch("https://api.emailjs.com/api/v1.0/email/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
					template_id: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
					user_id: process.env.NEXT_PUBLIC_EMAILJS_USER_ID || "",
					accessToken: process.env.NEXT_PUBLIC_EMAILJS_ACCESS_TOKEN || "",
					template_params: {
						to_email: "ayodeji2.okunola@live.uwe.ac.uk",
						subject: "Order Labs Record – Validation Errors",
						body: `
              <h2>Form Submission Failed</h2>
              <p>The following validation errors occurred:</p>
              <p>${errorList}</p>
              <p><strong>Total Error Count:</strong> ${errorCount}</p>
            `,
					},
				}),
			});
		} catch {
			errorToast("Form contains errors. They have been emailed.");
		}
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
		onSuccess: async () => {
			successToast("Lab order recorded.");

			reset();
			setClickCount(0);
			setErrorCount(0);
			prevErrorsRef.current = new Set();
			setIsCounting(false);
			setTestName("");
			setLocation("");
            setSelectedPatient(null);
		},
		onError: (err: any) => {
			setErrorCount((prev) => prev + 1);
			errorToast(err.message);
		},
    });

    const { mutate: createPatient, isPending: isCreatingPatient } =
		useSupabaseMutation<NewPatient>({
			table: "patients",
			type: "insert",
			invalidateKey: ["patients"],
			onSuccess: (data) => {
				if (data?.[0]) {
					const createdPatient: Patient = {
						id: data[0].id,
						first_name: data[0].first_name,
						last_name: data[0].last_name,
						age: data[0].age,
					};

					setSelectedPatient(createdPatient);

					setValue("first_name", createdPatient.first_name, {
						shouldValidate: true,
					});

					setValue("last_name", createdPatient.last_name, {
						shouldValidate: true,
					});

					setValue("age", String(createdPatient.age), {
						shouldValidate: true,
					});

					successToast("Patient created successfully");

					setShowNewPatientModal(false);
				}
			},
			onError: (err: any) => {
				errorToast(err.message);
			},
		});

	const handlePatientSelect = (patient: Patient | "new") => {
		if (patient === "new") {
			setShowNewPatientModal(true);
			setSelectedPatient(null);
		} else {
			setSelectedPatient(patient);

			reset((prev) => ({
				...prev,
				first_name: patient.first_name,
				last_name: patient.last_name,
				age: patient.age,
			}));
		}
	};

	const handleNewPatientSubmit = () => {
		if (
			!newPatientData.first_name ||
			!newPatientData.last_name ||
			!newPatientData.age
		) {
			errorToast("Please fill in all required fields");
			return;
		}

		createPatient({
			first_name: newPatientData.first_name,
			last_name: newPatientData.last_name,
			age: newPatientData.age,
		});
	};

	const onSubmit = async (data: LabsFormData): Promise<void> => {
		setIsCounting(false);

		const patientId: string = selectedPatient?.id || generateUniqueCode();

		const payload: NewLabsPayload = {
			...data,
			staff_first_name:
				localStorage.getItem("clinician_first_name") || "",
			staff_last_name: localStorage.getItem("clinician_last_name") || "",
			patient_id: patientId,
			participant_code: code ?? "",
			task_id: "LABS01",
			location: location,
			test_name: testName,
			click_count: clickCount,
			error_count: errorCount,
		};

		recordLabs(payload);
	};

	const handleInputFocus = (): void => {
		if (!isCounting) setIsCounting(true);
	};

	return (
		<div className="bg-white p-4 rounded-xl grid gap-6">
			<div>
				<h2 className="font-poppins font-bold text-lg">Order Labs</h2>
			</div>

			<div className="grid gap-4">
				<form
					className="grid gap-4 items-start md:grid-cols-2 lg:grid-cols-3"
					onSubmit={handleSubmit(onSubmit, onInvalid)}
				>
					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Patient
						</span>

						<div>
							<PatientSelect
								patients={patients}
								value={selectedPatient}
								onSelect={handlePatientSelect}
								onAddNew={() => handlePatientSelect("new")}
							/>
						</div>
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
										onFocus={handleInputFocus}
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
								onValueChange={(selected) => {
									setLocation(selected);
									handleInputFocus();
								}}
							>
								<SelectTrigger className="w-full input md:py-4 rounded-lg h-full lg:py-4">
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
							placeholder="Select date"
							{...register("date")}
							onFocus={handleInputFocus}
						/>
						{errors.date && (
							<p className="text-red text-sm">
								{errors.date.message}
							</p>
						)}
					</label>

					{isError && (
						<p className="text-red font-medium md:col-span-2 lg:col-span-3">
							{error?.message || "Something went wrong"}
						</p>
					)}

					<div className="grid gap-4 md:grid-cols-2 md:col-span-2 lg:col-span-3 mt-4">
						<button
							className="btn"
							type="submit"
							disabled={
								!isValid || isPending || !location || !testName
							}
						>
							{isPending ? "Recording lab order..." : "Submit"}
						</button>
					</div>
				</form>
			</div>

			{showNewPatientModal && (
				<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-5000 backdrop-blur-lg">
					<div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-poppins font-bold text-xl">
								Add New Patient
							</h3>

							<button
								onClick={() => setShowNewPatientModal(false)}
								className="py-0.5 px-1.5 hover:bg-gray-100 rounded-full"
								type="button"
							>
								✕
							</button>
						</div>

						<div className="grid gap-4">
							<label className="grid gap-2">
								<span className="font-poppins font-medium text-sm">
									First Name{" "}
									<span className="text-red">*</span>
								</span>

								<input
									type="text"
									className="input md:py-2 rounded-lg"
									value={newPatientData.first_name}
									onChange={(e) =>
										setNewPatientData((prev) => ({
											...prev,
											first_name: e.target.value,
										}))
									}
								/>
							</label>

							<label className="grid gap-2">
								<span className="font-poppins font-medium text-sm">
									Last Name{" "}
									<span className="text-red">*</span>
								</span>
								<input
									type="text"
									className="input md:py-2 rounded-lg"
									value={newPatientData.last_name}
									onChange={(e) =>
										setNewPatientData((prev) => ({
											...prev,
											last_name: e.target.value,
										}))
									}
								/>
							</label>

							<label className="grid gap-2">
								<span className="font-poppins font-medium text-sm">
									Age <span className="text-red">*</span>
								</span>
								<input
									type="text"
									inputMode="numeric"
									className="input md:py-2 rounded-lg"
									value={newPatientData.age}
									onChange={(e) =>
										setNewPatientData((prev) => ({
											...prev,
											age: e.target.value,
										}))
									}
								/>
							</label>

							<div className="grid gap-3 md:grid-cols-2 mt-4">
								<button
									type="button"
									onClick={() =>
										setShowNewPatientModal(false)
									}
									className="btn bg-red after:border-red border-red"
								>
									Cancel
								</button>

								<button
									type="button"
									onClick={handleNewPatientSubmit}
									className="btn"
									disabled={isCreatingPatient}
								>
									{isCreatingPatient
										? "Adding..."
										: "Add Patient"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default RecordLabs;
