"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { useClinicianCode } from "@/hooks/use-clinician-code";

interface Meds {
	id: string;
	participant_code: string;
	patient_name: string;
	click_count: number;
	duration: number;
	task_id: string;
	drug_name: string;
	drug_strength: string;
	frequency: string;
	is_active: boolean;
}

const MedsSchema = z.object({
	patient_name: z.string().min(2, "Patient name is required"),

	drug_name: z.string().min(2, "Drug name is required"),

	drug_strength: z.string().min(2, "Drug quantity is required"),

	frequency: z.string().min(2, "Drug frequency is required"),
});

type MedsFormData = z.infer<typeof MedsSchema>;

const RecordMeds = () => {
	const { code } = useClinicianCode();

	const [isRunning, setIsRunning] = useState(false);
	const [time, setTime] = useState(0);
	const [clickCount, setClickCount] = useState(0);

	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = useForm<MedsFormData>({
		resolver: zodResolver(MedsSchema),
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

			successToast("Record added successfully.");

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
                            <th>Patient Name</th>
                            <td>${newRecord?.patient_name}</td>
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
                            <th>Duration</th>
                            <td>${newRecord?.duration} seconds</td>
                        </tr>
                        <tr>
                            <th>Click Count</th>
                            <td>${newRecord?.click_count}</td>
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

            handleResetTimer();

			reset();
		},
		onError: (error) => {
			errorToast(error.message);
		},
	});

	const onSubmit = async (data: MedsFormData) => {
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
			task_id: "MEDS01",
		};

		recordMeds({
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
						Add a medication
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
							Drug Name (e.g., Atorvastatin)
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="text"
							placeholder="Enter drug name"
							disabled={!isRunning}
							{...register("drug_name")}
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
							placeholder="Enter drug's dosage"
							disabled={!isRunning}
							{...register("drug_strength")}
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
							disabled={!isRunning}
							{...register("frequency")}
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
							disabled={!isRunning || !isValid || isPending}
						>
							{isPending
								? "Adding medication..."
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

export default RecordMeds;
