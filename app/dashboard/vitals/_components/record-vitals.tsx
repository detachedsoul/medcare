"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { useClinicianCode } from "@/hooks/use-clinician-code";

interface Vitals {
	id: string;
	staff_id: string;
	patient_name: string;
	blood_pressure: string;
	heart_rate: number;
	temperature: string;
	weight: string;
	duration: number;
	click_count: number;
}

const vitalsSchema = z.object({
	patient_name: z.string().min(2, "Patient name is required"),

	systolic: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Systolic is required"),

	diastolic: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Diastolic is required"),

	heart_rate: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Heart rate is required"),

	temperature: z
		.string()
		.regex(/^\d+(\.\d+)?$/, "Enter a valid number")
		.refine((val) => parseFloat(val) > 0, {
			message: "Temperature must be greater than 0",
		}),

	weight: z
		.string()
		.regex(/^\d+(\.\d+)?$/, "Enter a valid number")
		.refine((val) => parseFloat(val) > 0, {
			message: "Weight must be greater than 0",
		}),
});

type VitalsFormData = z.infer<typeof vitalsSchema>;

const RecordVitals = () => {
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
	} = useForm<VitalsFormData>({
		resolver: zodResolver(vitalsSchema),
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

            successToast("Vitals recorded successfully.");

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
						subject: "Order Labs Record Created",
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
                    <h1>New Medication Record Created</h1>
                    <p>A new medication record has been added successfully. Below are the details:</p>

                    <table>
                        <tr>
                            <th>Patient Name</th>
                            <td>${newRecord?.patient_name}</td>
                        </tr>
                        <tr>
                            <th>Blood Pressure</th>
                            <td>${newRecord?.blood_pressure}</td>
                        </tr>
                        <tr>
                            <th>Heart Rate</th>
                            <td>${newRecord?.heart_rate}</td>
                        </tr>
                        <tr>
                            <th>Temperature</th>
                            <td>${newRecord?.temperature} °C</td>
                        </tr>
                        <tr>
                            <th>Weight</th>
                            <td>${newRecord?.weight}</td>
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

    const onSubmit = async (data: VitalsFormData) => {
        if (!isRunning) {
			errorToast("Start the timer before completing the task.");
			return;
		}

		if (timerRef.current) {
			clearInterval(timerRef.current);

            timerRef.current = null;
		}

		setIsRunning(false);

		const bloodPressure = `${data.systolic}/${data.diastolic}`;

		const payload = {
			weight: data.weight,
			duration: time,
			blood_pressure: bloodPressure,
			heart_rate: Number(data.heart_rate),
			click_count: clickCount,
			staff_id: code ?? "",
			patient_name: data.patient_name,
			temperature: data.temperature,
			task_id: "VITALS01",
		};

		recordVitals({
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
						Record Vitals
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
					className="grid gap-4 items-start md:grid-cols-3"
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
							Blood pressure (mmHg)
						</span>

						<div className="flex items-center gap-2">
							<input
								className="input md:py-2 rounded-lg w-full"
								type="text"
								inputMode="numeric"
								placeholder="Systolic"
								disabled={!isRunning}
								{...register("systolic")}
							/>

							<span>╱</span>

							<input
								className="input md:py-2 rounded-lg w-full"
								type="text"
								inputMode="numeric"
								placeholder="Diastolic"
								disabled={!isRunning}
								{...register("diastolic")}
							/>
						</div>

						{(errors.systolic || errors.diastolic) && (
							<p className="text-red text-sm">
								{errors.systolic?.message ||
									errors.diastolic?.message}
							</p>
						)}
					</label>

					{/* Heart Rate */}
					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Heart rate (bpm)
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="text"
							inputMode="numeric"
							placeholder="Enter heart rate"
							disabled={!isRunning}
							{...register("heart_rate")}
						/>

						{errors.heart_rate && (
							<p className="text-red text-sm">
								{errors.heart_rate.message}
							</p>
						)}
					</label>

					{/* Temperature */}
					<label className="grid gap-2">
						<span className="font-poppins font-medium text-sm">
							Temperature (°C)
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="text"
							inputMode="decimal"
							placeholder="Enter temperature"
							disabled={!isRunning}
							{...register("temperature")}
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
							disabled={!isRunning}
							{...register("weight")}
						/>

						{errors.weight && (
							<p className="text-red text-sm">
								{errors.weight.message}
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

export default RecordVitals;
