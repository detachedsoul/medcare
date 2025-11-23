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

interface Meds {
	id: string;
	participant_code: string;
	patient_id: string;
	drug_name: string;
	drug_strength: string;
	frequency: string;
	task_id: string;
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
	click_count: number;
	error_count: number;
	[key: string]: any;
}

const MedsSchema = z.object({
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

    const firstRunRef = useRef(true);

    const prevErrorsRef = useRef<Set<string>>(new Set());

	const {
		register,
		handleSubmit,
		reset,
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
		onSuccess: async (data) => {
			const newRecord = data?.[0];

			successToast("Medication recorded.");

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
							subject: "Medication Record Created",
							body: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>New Medication Record</title>
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
                        <h1>New Medication Record Created</h1>
                        <p>A new medication record has been added successfully. Below are the details:</p>

                        <table>
                            <tr>
                                <th>Patient ID</th>
                                <td>${newRecord?.patient_id}</td>
                            </tr>
                            <tr>
                                <th>Drug Name</th>
                                <td>${newRecord?.drug_name}</td>
                            </tr>
                            <tr>
                                <th>Drug Strength</th>
                                <td>${newRecord?.drug_strength}</td>
                            </tr>
                            <tr>
                                <th>Frequency</th>
                                <td>${newRecord?.frequency}</td>
                            </tr>
                            <tr>
                                <th>Participant Code</th>
                                <td>${code}</td>
                            </tr>
                            <tr>
                                <th>Task ID</th>
                                <td>MEDS01</td>
                            </tr>
                            <tr>
                                <th>Click Count</th>
                                <td>${newRecord?.click_count ?? clickCount}</td>
                            </tr>
                            <tr>
                                <th>Error Count</th>
                                <td>${newRecord?.error_count ?? errorCount}</td>
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

	const onSubmit = async (data: MedsFormData): Promise<void> => {
		setIsCounting(false);

		const patientId: string = generateUniqueCode();

		const payload: NewMedsPayload = {
			...data,
			patient_id: patientId,
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
							Drug Name (e.g., Atorvastatin)
						</span>
						<input
							className="input md:py-2 rounded-lg"
							type="text"
							placeholder="Enter drug name"
							{...register("drug_name")}
							onFocus={handleInputFocus}
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
		</div>
	);
};

export default RecordMeds;
