/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import { generateUniqueCode } from "@/lib/generate-unique-code";

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

    const firstRunRef = useRef(true);

    const prevErrorsRef = useRef<Set<string>>(new Set());

	const {
		register,
		handleSubmit,
        reset,
        watch,
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

    console.log(watch())

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
		onSuccess: async (data) => {
			const newRecord = data?.[0];

			successToast("Vitals recorded.");

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
							subject: "Vitals Record Created",
							body: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>New Vitals Record</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f9fafb;
                            color: #111827;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 40px auto;
                            background: white;
                            padding: 24px;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                        }
                        h1 {
                            color: #16a34a;
                            font-size: 20px;
                            margin-bottom: 16px;
                        }
                        p {
                            font-size: 15px;
                            line-height: 1.6;
                            margin: 8px 0;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 16px;
                        }
                        th, td {
                            text-align: left;
                            padding: 10px;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        th {
                            background-color: #f3f4f6;
                            color: #374151;
                            font-weight: 600;
                        }
                        .footer {
                            margin-top: 32px;
                            font-size: 13px;
                            color: #6b7280;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>New Vitals Record Created</h1>
                        <p>A new vitals record has been added successfully. Below are the details:</p>

                        <table>
                            <tr>
                                <th>Patient ID</th>
                                <td>${newRecord?.patient_id}</td>
                            </tr>
                            <tr>
                                <th>First Name</th>
                                <td>${newRecord?.first_name}</td>
                            </tr>
                            <tr>
                                <th>Last Name</th>
                                <td>${newRecord?.last_name}</td>
                            </tr>
                            <tr>
                                <th>Age</th>
                                <td>${newRecord?.age}</td>
                            </tr>
                            <tr>
                                <th>Blood Pressure</th>
                                <td>${newRecord?.blood_pressure}</td>
                            </tr>
                            <tr>
                                <th>Heart Rate</th>
                                <td>${newRecord?.heart_rate} bpm</td>
                            </tr>
                            <tr>
                                <th>Temperature</th>
                                <td>${newRecord?.temperature} °C</td>
                            </tr>
                            <tr>
                                <th>Weight</th>
                                <td>${newRecord?.weight} kg</td>
                            </tr>
                            <tr>
                                <th>Participant Code</th>
                                <td>${code}</td>
                            </tr>
                            <tr>
                                <th>Task ID</th>
                                <td>VITALS01</td>
                            </tr>
                            <tr>
                                <th>Click Count</th>
                                <td>${newRecord?.click_count}</td>
                            </tr>
                            <tr>
                                <th>Error Count</th>
                                <td>${newRecord?.error_count}</td>
                            </tr>
                        </table>

                        <p style="margin-top: 24px;">Keep up the great work! 🎉</p>

                        <div class="footer">
                            <p>This is an automated message from your Med Reconciliation System.</p>
                        </div>
                    </div>
                </body>
                </html>
              `,
						},
					}),
				});
			} catch (err: unknown) {
				console.error("Failed to send success email:", err);
			}

			reset();
			setClickCount(0);
			setErrorCount(0);
			allErrorsRef.current.clear();
			setIsCounting(false);
		},
		onError: (err: any) => {
			setErrorCount((prev) => prev + 1);
			errorToast(err.message);
		},
	});

	const onSubmit = async (data: VitalsFormData): Promise<void> => {
		setIsCounting(false);

		const patientId: string = generateUniqueCode();

		const bloodPressure = `${data.systolic}/${data.diastolic}`;

        const payload: NewVitalsPayload = {
			patient_id: patientId,
			blood_pressure: bloodPressure,
			heart_rate: Number(data.heart_rate),
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
							First Name
						</span>
						<input
							className="input md:py-2 rounded-lg"
							type="text"
							placeholder="Enter first name"
							{...register("first_name")}
							onFocus={handleInputFocus}
						/>
						{errors.first_name && (
							<p className="text-red text-sm">
								{errors.first_name.message}
							</p>
						)}
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Last Name
						</span>
						<input
							className="input md:py-2 rounded-lg"
							type="text"
							placeholder="Enter last name"
							{...register("last_name")}
							onFocus={handleInputFocus}
						/>
						{errors.last_name && (
							<p className="text-red text-sm">
								{errors.last_name.message}
							</p>
						)}
					</label>

					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Age
						</span>
						<input
							className="input md:py-2 rounded-lg"
							type="number"
							placeholder="Enter age"
							{...register("age")}
							onFocus={handleInputFocus}
						/>
						{errors.age && (
							<p className="text-red text-sm">
								{errors.age.message}
							</p>
						)}
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
		</div>
	);
};

export default RecordVitals;
