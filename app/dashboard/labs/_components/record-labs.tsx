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

export const tests = [
	// Hematology
	{ value: "FBC Full Blood Count", label: "FBC Full Blood Count" },
	{ value: "WBC White Blood Cells", label: "WBC White Blood Cells" },
	{ value: "RBC Red Blood Cells", label: "RBC Red Blood Cells" },
	{ value: "Hemoglobin", label: "Hemoglobin" },
	{ value: "Hematocrit", label: "Hematocrit" },
	{
		value: "MCV Mean Corpuscular Volume",
		label: "MCV Mean Corpuscular Volume",
	},
	{
		value: "MCH Mean Corpuscular Hemoglobin",
		label: "MCH Mean Corpuscular Hemoglobin",
	},
	{
		value: "MCHC Mean Corpuscular Hemoglobin Concentration",
		label: "MCHC Mean Corpuscular Hemoglobin Concentration",
	},
	{ value: "Platelet Count", label: "Platelet Count" },
	{ value: "Reticulocyte Count", label: "Reticulocyte Count" },
	{ value: "Neutrophils", label: "Neutrophils" },
	{ value: "Lymphocytes", label: "Lymphocytes" },
	{ value: "Monocytes", label: "Monocytes" },
	{ value: "Eosinophils", label: "Eosinophils" },
	{ value: "Basophils", label: "Basophils" },
	{
		value: "ESR Erythrocyte Sedimentation Rate",
		label: "ESR Erythrocyte Sedimentation Rate",
	},
	{ value: "CRP C-Reactive Protein", label: "CRP C-Reactive Protein" },
	{ value: "CRP High Sensitivity", label: "CRP High Sensitivity" },
	{ value: "Blood Film", label: "Blood Film" },
	{ value: "Coagulation Profile", label: "Coagulation Profile" },
	{ value: "PT Prothrombin Time", label: "PT Prothrombin Time" },
	{
		value: "APTT Activated Partial Thromboplastin Time",
		label: "APTT Activated Partial Thromboplastin Time",
	},
	{
		value: "INR International Normalized Ratio",
		label: "INR International Normalized Ratio",
	},

	// Biochemistry / Metabolic Panels
	{ value: "U&E Urea & Electrolytes", label: "U&E Urea & Electrolytes" },
	{ value: "Creatinine", label: "Creatinine" },
	{ value: "Urea", label: "Urea" },
	{ value: "Sodium", label: "Sodium" },
	{ value: "Potassium", label: "Potassium" },
	{ value: "Chloride", label: "Chloride" },
	{ value: "Bicarbonate", label: "Bicarbonate" },
	{ value: "RFT Renal Function Test", label: "RFT Renal Function Test" },
	{ value: "LFT Liver Function Tests", label: "LFT Liver Function Tests" },
	{
		value: "AST Aspartate Transaminase",
		label: "AST Aspartate Transaminase",
	},
	{ value: "ALT Alanine Transaminase", label: "ALT Alanine Transaminase" },
	{ value: "ALP Alkaline Phosphatase", label: "ALP Alkaline Phosphatase" },
	{
		value: "GGT Gamma-Glutamyl Transferase",
		label: "GGT Gamma-Glutamyl Transferase",
	},
	{ value: "Bilirubin Total", label: "Bilirubin Total" },
	{ value: "Bilirubin Direct", label: "Bilirubin Direct" },
	{ value: "Albumin", label: "Albumin" },
	{ value: "Total Protein", label: "Total Protein" },
	{ value: "Amylase", label: "Amylase" },
	{ value: "Lipase", label: "Lipase" },
	{ value: "Calcium", label: "Calcium" },
	{ value: "Magnesium", label: "Magnesium" },
	{ value: "Phosphate", label: "Phosphate" },
	{ value: "Uric Acid", label: "Uric Acid" },
	{ value: "Lipid Profile", label: "Lipid Profile" },
	{ value: "Cholesterol Total", label: "Cholesterol Total" },
	{ value: "HDL Cholesterol", label: "HDL Cholesterol" },
	{ value: "LDL Cholesterol", label: "LDL Cholesterol" },
	{ value: "Triglycerides", label: "Triglycerides" },
	{ value: "Blood Glucose", label: "Blood Glucose" },
	{ value: "Fasting Blood Sugar", label: "Fasting Blood Sugar" },
	{ value: "Random Blood Sugar", label: "Random Blood Sugar" },
	{ value: "2hr Postprandial Glucose", label: "2hr Postprandial Glucose" },
	{ value: "HbA1c Glycated Hemoglobin", label: "HbA1c Glycated Hemoglobin" },
	{ value: "Creatine Kinase CK", label: "Creatine Kinase CK" },
	{ value: "Troponin I", label: "Troponin I" },
	{ value: "Troponin T", label: "Troponin T" },

	// Endocrine / Hormones
	{
		value: "TSH Thyroid Stimulating Hormone",
		label: "TSH Thyroid Stimulating Hormone",
	},
	{ value: "FT3 Free Triiodothyronine", label: "FT3 Free Triiodothyronine" },
	{ value: "FT4 Free Thyroxine", label: "FT4 Free Thyroxine" },
	{ value: "Cortisol", label: "Cortisol" },
	{
		value: "ACTH Adrenocorticotropic Hormone",
		label: "ACTH Adrenocorticotropic Hormone",
	},
	{
		value: "FSH Follicle Stimulating Hormone",
		label: "FSH Follicle Stimulating Hormone",
	},
	{ value: "LH Luteinizing Hormone", label: "LH Luteinizing Hormone" },
	{ value: "Prolactin", label: "Prolactin" },
	{ value: "Testosterone", label: "Testosterone" },
	{ value: "Estradiol", label: "Estradiol" },
	{ value: "Progesterone", label: "Progesterone" },
	{ value: "Insulin", label: "Insulin" },

	// Vitamins / Minerals / Trace Elements
	{ value: "Vitamin B12", label: "Vitamin B12" },
	{ value: "Folate", label: "Folate" },
	{ value: "Vitamin D", label: "Vitamin D" },
	{ value: "Vitamin C", label: "Vitamin C" },
	{ value: "Iron Studies", label: "Iron Studies" },
	{ value: "Ferritin", label: "Ferritin" },
	{ value: "Transferrin", label: "Transferrin" },
	{ value: "Zinc", label: "Zinc" },
	{ value: "Copper", label: "Copper" },

	// Infectious / Serology
	{ value: "HIV Test", label: "HIV Test" },
	{
		value: "Hepatitis B Surface Antigen",
		label: "Hepatitis B Surface Antigen",
	},
	{ value: "Hepatitis C Antibody", label: "Hepatitis C Antibody" },
	{ value: "VDRL / RPR Syphilis Test", label: "VDRL / RPR Syphilis Test" },
	{ value: "Malaria Parasite", label: "Malaria Parasite" },
	{ value: "TB Tuberculosis Test", label: "TB Tuberculosis Test" },
	{ value: "Blood Culture", label: "Blood Culture" },
	{ value: "Urine Culture", label: "Urine Culture" },
	{ value: "Stool Culture", label: "Stool Culture" },
	{ value: "PCR COVID-19", label: "PCR COVID-19" },
	{ value: "PCR Influenza A/B", label: "PCR Influenza A/B" },
	{ value: "PCR RSV", label: "PCR RSV" },
	{ value: "COVID-19 Antibody Test", label: "COVID-19 Antibody Test" },
	{ value: "H. Pylori Antigen", label: "H. Pylori Antigen" },

	// Autoimmune / Inflammatory
	{ value: "ANA Antinuclear Antibody", label: "ANA Antinuclear Antibody" },
	{ value: "Anti-dsDNA", label: "Anti-dsDNA" },
	{ value: "RF Rheumatoid Factor", label: "RF Rheumatoid Factor" },
	{ value: "Anti-CCP", label: "Anti-CCP" },
	{ value: "Complement C3", label: "Complement C3" },
	{ value: "Complement C4", label: "Complement C4" },

	// Tumor Markers
	{ value: "AFP Alpha-Fetoprotein", label: "AFP Alpha-Fetoprotein" },
	{
		value: "CEA Carcinoembryonic Antigen",
		label: "CEA Carcinoembryonic Antigen",
	},
	{ value: "CA-125", label: "CA-125" },
	{ value: "CA-19-9", label: "CA-19-9" },
	{
		value: "PSA Prostate Specific Antigen",
		label: "PSA Prostate Specific Antigen",
	},
	{ value: "Beta HCG", label: "Beta HCG" },

	// Misc / Specialty
	{ value: "Urinalysis", label: "Urinalysis" },
	{ value: "Pregnancy Test", label: "Pregnancy Test" },
	{ value: "Stool Occult Blood", label: "Stool Occult Blood" },
	{ value: "Electrocardiogram ECG", label: "Electrocardiogram ECG" },
	{ value: "Chest X-ray CXR", label: "Chest X-ray CXR" },
	{ value: "Echocardiogram", label: "Echocardiogram" },
	{ value: "ABG Arterial Blood Gas", label: "ABG Arterial Blood Gas" },
	{
		value: "TFT Thyroid Function Test Panel",
		label: "TFT Thyroid Function Test Panel",
	},
	{ value: "Hormone Panel", label: "Hormone Panel" },
	{ value: "Metabolic Panel", label: "Metabolic Panel" },
	{ value: "Electrolyte Panel", label: "Electrolyte Panel" },
	{ value: "Liver Panel", label: "Liver Panel" },
	{ value: "Renal Panel", label: "Renal Panel" },
	{ value: "Cardiac Panel", label: "Cardiac Panel" },
	{ value: "Coagulation Panel", label: "Coagulation Panel" },
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

	const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
		null,
	);

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
			const result = await zodResolver(labsSchema)(
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
									<Command className="max-h-60 z-50000">
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
