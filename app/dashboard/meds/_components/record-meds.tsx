/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import PatientSelect from "@/components/patient-select";
import DrugSelect from "@/components/drug-select";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import { generateUniqueCode } from "@/lib/generate-unique-code";
import { Patient, patients } from "@/lib/patients";

interface Meds {
	id: string;
	participant_code: string;
	patient_id: string;
	drug_name: string;
	drug_strength: string;
	frequency: string;
	task_id: string;
	first_name: string;
	last_name: string;
	age: string;
	click_count: number;
	error_count: number;
	is_active: boolean;
}

interface FormErrorItem {
	message?: string;
	[key: string]: any;
}

interface FormErrorsMap {
	[key: string]: FormErrorItem | undefined;
}

interface NewMedsPayload {
	drug_name: string;
	drug_strength: string;
	frequency: string;
	patient_id: string;
	participant_code: string;
    task_id: string;
    first_name: string;
	last_name: string;
	age: string;
	click_count: number;
	error_count: number;
	[key: string]: any;
}

interface NewPatient {
	id: string;
	first_name: string;
	last_name: string;
	age: string;
}

const MedsSchema = z.object({
	first_name: z.string().min(1, "Please enter first name"),
	last_name: z.string().min(1, "Please enter last name"),
	age: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Please enter age"),
	drug_name: z
		.string()
		.trim()
		.min(1, "Drug name is required")
		.regex(
			/^[A-Za-z0-9\s\-]+$/,
			"Invalid drug name (only letters, numbers, spaces, hyphens allowed)",
		),

	drug_strength: z
		.string()
		.trim()
		.min(1, "Drug strength is required")
		.regex(
			/^\d+(\.\d+)?\s?(mg|g|mcg|ml|units|IU)(\/\d+(\.\d+)?\s?(mg|g|mcg|ml))?$/i,
			"Strength must be like '20 mg' or '5 mg/5ml'",
		),

	frequency: z
		.string()
		.trim()
		.min(1, "Drug frequency is required")
		.regex(
			/^(once daily|daily|nightly|BID|TID|QID|QOD|PRN|every\s\d+\shours)$/i,
			"Invalid frequency (e.g., BID, TID, PRN, Nightly)",
		),
});

type MedsFormData = z.infer<typeof MedsSchema>;

const RecordMeds = () => {
	const { code } = useClinicianCode();

    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const [showNewPatientModal, setShowNewPatientModal] = useState(false);

	const [newPatientData, setNewPatientData] = useState({
		first_name: "",
		last_name: "",
		age: "",
	});

    const firstRunRef = useRef(true);

    const prevErrorsRef = useRef<Set<string>>(new Set());

	const {
		register,
        watch,
		handleSubmit,
		reset,
        setValue,
		formState: { errors, isValid },
	} = useForm<MedsFormData>({
		resolver: async (data, context, options) => {
			const result = await zodResolver(MedsSchema)(
				data,
				context,
				options,
			);

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
					setErrorCount((prev) => prev + 1); // Increment only for new errors
				}
			});

			// Remove resolved errors from the set
			prevErrorsRef.current.forEach((msg) => {
				if (!currentErrorMessages.includes(msg)) {
					prevErrorsRef.current.delete(msg);
				}
			});

			return result;
		},
		mode: "all",
    });

	const [clickCount, setClickCount] = useState<number>(0);
	const [errorCount, setErrorCount] = useState<number>(0);
	const [isCounting, setIsCounting] = useState<boolean>(false);
	const allErrorsRef = useRef<Set<string>>(new Set());
	const clickHandlerRef = useRef<(e: MouseEvent) => void>(() => {});

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
					service_id:
						process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
					template_id:
						process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
					user_id: process.env.NEXT_PUBLIC_EMAILJS_USER_ID || "",
					accessToken:
						process.env.NEXT_PUBLIC_EMAILJS_ACCESS_TOKEN || "",
					template_params: {
						to_email: "ayodeji2.okunola@live.uwe.ac.uk",
						subject: "Medication Record – Validation Errors",
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
		mutate: recordMeds,
		isPending,
		isError,
		error,
	} = useSupabaseMutation<Meds>({
		table: "reconcile-meds",
		type: "insert",
		invalidateKey: ["reconcile-meds"],
		onSuccess: async () => {
			successToast("Medication recorded.");

			reset();
			setClickCount(0);
			setErrorCount(0);
			allErrorsRef.current.clear();
            setIsCounting(false);
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

            setValue("first_name", patient.first_name, {
				shouldValidate: true,
			});

			setValue("last_name", patient.last_name, {
				shouldValidate: true,
			});

			setValue("age", String(patient.age), {
				shouldValidate: true,
			});
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

	const onSubmit = async (data: MedsFormData): Promise<void> => {
		setIsCounting(false);

		const patientId: string = selectedPatient?.id || generateUniqueCode();

		const payload: NewMedsPayload = {
			...data,
			patient_id: patientId,
            staff_first_name: localStorage.getItem("clinician_first_name") || "",
            staff_last_name: localStorage.getItem("clinician_last_name") || "",
			participant_code: code ?? "",
			task_id: "MEDS01",
			click_count: clickCount,
			error_count: errorCount,
		};

		recordMeds(payload);
	};

	const handleInputFocus = (): void => {
		if (!isCounting) setIsCounting(true);
	};

	return (
		<div className="bg-white p-4 rounded-xl grid gap-6">
			<div>
				<h2 className="font-poppins font-bold text-lg">
					Add a medication
				</h2>
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
							Drug Name
						</span>

						<DrugSelect
							value={watch("drug_name")}
							onSelect={(drug) => {
								setValue("drug_name", drug, {
									shouldValidate: true,
									shouldDirty: true,
								});
							}}
							placeholder="Select drug"
						/>

						{errors.drug_name && (
							<p className="text-red text-sm">
								{errors.drug_name.message}
							</p>
						)}
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Strength (e.g., 20 mg)
						</span>
						<input
							className="input md:py-2 rounded-lg"
							type="text"
							placeholder="Enter drug dosage"
							{...register("drug_strength")}
							onFocus={handleInputFocus}
						/>

						{errors.drug_strength && (
							<p className="text-red text-sm">
								{errors.drug_strength.message}
							</p>
						)}
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Frequency (e.g., Nightly)
						</span>
						<input
							className="input md:py-2 rounded-lg"
							type="text"
							placeholder="Enter drug use frequency"
							{...register("frequency")}
							onFocus={handleInputFocus}
						/>
						{errors.frequency && (
							<p className="text-red text-sm">
								{errors.frequency.message}
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
							disabled={!isValid || isPending}
						>
							{isPending ? "Adding medication..." : "Submit"}
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

export default RecordMeds;
