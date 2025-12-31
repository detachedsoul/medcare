/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import PatientSelect from "@/components/patient-select";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import { generateUniqueCode } from "@/lib/generate-unique-code";
import { Patient, patients } from "@/lib/patients";

interface Vitals {
	id: string;
	staff_id: string;
	patient_id: string;
	blood_pressure: string;
	heart_rate: number;
	temperature: string;
	first_name: string;
	last_name: string;
	age: string;
	weight: string;
	click_count: number;
	error_count: number;
}

interface NewPatient {
    id: string;
	first_name: string;
	last_name: string;
	age: string;
}

interface FormErrorItem {
	message?: string;
	[key: string]: any;
}

interface FormErrorsMap {
	[key: string]: FormErrorItem | undefined;
}

interface NewVitalsPayload {
	patient_id: string;
	blood_pressure: string;
	heart_rate: number;
	temperature: string;
	first_name: string;
	last_name: string;
	age: string;
	weight: string;
	staff_id: string;
	task_id: string;
	click_count: number;
	error_count: number;
    [key: string]: any;
}

const vitalsSchema = z.object({
	first_name: z.string().min(1, "Please enter first name"),
	last_name: z.string().min(1, "Please enter last name"),
	age: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Please enter age"),
	systolic: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Systolic is required")
		.refine((val) => {
			const num = parseInt(val);
			return num >= 70 && num <= 250;
		}, "Systolic must be between 70-250 mmHg"),

	diastolic: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Diastolic is required")
		.refine((val) => {
			const num = parseInt(val);
			return num >= 40 && num <= 150;
		}, "Diastolic must be between 40-150 mmHg"),

	heart_rate: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Heart rate is required")
		.refine((val) => {
			const num = parseInt(val);
			return num >= 30 && num <= 220;
		}, "Heart rate must be between 30-220 bpm"),

	temperature: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Enter a valid number (e.g., 37.5)")
		.refine((val) => {
			const num = parseFloat(val);
			return num >= 35.0 && num <= 42.0;
		}, "Temperature must be between 35.0-42.0 °C"),

	weight: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Enter a valid number (e.g., 70.5)")
		.refine((val) => {
			const num = parseFloat(val);
			return num >= 2.0 && num <= 300.0;
		}, "Weight must be between 2.0-300.0 kg"),
});

type VitalsFormData = z.infer<typeof vitalsSchema>;

const RecordVitals = () => {
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
		handleSubmit,
        reset,
        setValue,
		formState: { errors, isValid },
	} = useForm<VitalsFormData>({
		resolver: async (data, context, options) => {
			const result = await zodResolver(vitalsSchema)(
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

                    setValue("first_name", createdPatient.first_name, { shouldValidate: true });

                    setValue("last_name", createdPatient.last_name, { shouldValidate: true });

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
						subject: "Vitals Record – Validation Errors",
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
		mutate: recordVitals,
		isPending,
		isError,
		error,
	} = useSupabaseMutation<Vitals>({
		table: "vitals",
		type: "insert",
		invalidateKey: ["vitals"],
		onSuccess: async () => {
			successToast("Vitals recorded.");

			reset();
			setClickCount(0);
			setErrorCount(0);
			allErrorsRef.current.clear();
			setIsCounting(false);
			setSelectedPatient(null);

			setNewPatientData({
				first_name: "",
				last_name: "",
				age: "",
			});
		},
		onError: (err: any) => {
			setErrorCount((prev) => prev + 1);
			errorToast(err.message);
		},
	});

	const onSubmit = async (data: VitalsFormData): Promise<void> => {
		setIsCounting(false);

		const patientId: string = selectedPatient?.id || generateUniqueCode();

		const bloodPressure = `${data.systolic}/${data.diastolic}`;

		const payload: NewVitalsPayload = {
			patient_id: patientId,
			blood_pressure: bloodPressure,
			heart_rate: Number(data.heart_rate),
			staff_first_name:
				localStorage.getItem("clinician_first_name") || "",
			staff_last_name:
				localStorage.getItem("clinician_last_name") || "",
			first_name: data.first_name,
			last_name: data.last_name,
			age: data.age,
			temperature: data.temperature,
			weight: data.weight,
			staff_id: code ?? "",
			task_id: "VITALS01",
			click_count: clickCount,
			error_count: errorCount,
		};

		recordVitals(payload);
	};

	const handleInputFocus = (): void => {
		if (!isCounting) setIsCounting(true);
	};

	return (
		<div className="bg-white p-4 rounded-xl grid gap-6">
			<div>
				<h2 className="font-poppins font-bold text-lg">
					Record Vitals
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
							Blood pressure (mmHg)
						</span>

						<div className="flex items-center gap-2">
							<input
								className="input md:py-2 rounded-lg w-full"
								type="text"
								inputMode="numeric"
								placeholder="Systolic"
								{...register("systolic")}
								onFocus={handleInputFocus}
							/>

							<span>╱</span>

							<input
								className="input md:py-2 rounded-lg w-full"
								type="text"
								inputMode="numeric"
								placeholder="Diastolic"
								{...register("diastolic")}
								onFocus={handleInputFocus}
							/>
						</div>

						<div className="flex items-center justify-between gap-4">
							{errors?.systolic && (
								<p className="text-red text-sm">
									{errors.systolic?.message}
								</p>
							)}

							{errors?.diastolic && (
								<p className="text-red text-sm">
									{errors.diastolic?.message}
								</p>
							)}
						</div>
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Heart rate (bpm)
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="text"
							inputMode="numeric"
							placeholder="Enter heart rate"
							{...register("heart_rate")}
							onFocus={handleInputFocus}
						/>

						{errors.heart_rate && (
							<p className="text-red text-sm">
								{errors.heart_rate.message}
							</p>
						)}
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Temperature (°C)
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="text"
							inputMode="decimal"
							placeholder="Enter temperature"
							{...register("temperature")}
							onFocus={handleInputFocus}
						/>

						{errors.temperature && (
							<p className="text-red text-sm">
								{errors.temperature.message}
							</p>
						)}
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Weight (kg)
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="text"
							inputMode="decimal"
							placeholder="Enter weight"
							{...register("weight")}
							onFocus={handleInputFocus}
						/>

						{errors.weight && (
							<p className="text-red text-sm">
								{errors.weight.message}
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
							disabled={!isValid || isPending}
						>
							{isPending ? "Recording vitals..." : "Submit"}
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

export default RecordVitals;
