"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const vitalsSchema = z.object({
	patientName: z.string().min(2, "Patient name is required"),

	systolic: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Systolic is required"),

	diastolic: z
		.string()
		.regex(/^\d+$/, "Enter a valid number")
		.min(1, "Diastolic is required"),

	heartRate: z
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

	useEffect(() => {
        if (!isRunning) return;

        const handleClick = () => setClickCount((prev) => prev + 1);

        window.addEventListener("click", handleClick);

		return () => window.removeEventListener("click", handleClick);
	}, [isRunning]);

	const handleFormSubmit = async (data: VitalsFormData) => {
		if (!isRunning) {
			alert("Start the timer before completing the task.");
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
			recorded_at: new Date().toISOString(),
		};

		try {
			// await supabase insert hook here
			console.log("✅ Payload sent:", payload);
			alert("✅ Vitals recorded successfully!");
			handleResetTimer();
		} catch (error) {
			console.error(error);
			alert("❌ Failed to record vitals.");
		}
	};

	const formatTime = (t: number) => {
		const minutes = Math.floor(t / 60);

		const seconds = t % 60;

		return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
			2,
			"0",
		)}`;
	};

	return (
		<div className="bg-white p-4 rounded-xl grid gap-6">
			<div className="flex items-center gap-x-4 gap-y-3 justify-between flex-wrap">
				<div>
					<h2 className="font-poppins font-bold text-lg">
						Patient Metrics
					</h2>

					<p className="text-sm">Information about your patients</p>
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
					onSubmit={(e) => {
						e.preventDefault();
						void handleSubmit(handleFormSubmit)(e);
					}}
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
							{...register("patientName")}
						/>

						{errors.patientName && (
							<p className="text-red text-sm">
								{errors.patientName.message}
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
							{...register("heartRate")}
						/>

						{errors.heartRate && (
							<p className="text-red text-sm">
								{errors.heartRate.message}
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

					<div className="grid gap-4 md:grid-cols-2 md:col-span-3 mt-4">
						<button
							className="btn"
							type="submit"
							disabled={!isRunning || !isValid}
						>
							Complete Task
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
