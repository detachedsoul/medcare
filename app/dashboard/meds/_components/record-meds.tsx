"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { errorToast, successToast } from "@/lib/toast";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import { redirect } from "next/navigation";

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

	drug_name: z.string().min(2, "Drug name is required"),

    drug_strength: z.string().min(2, "Drug quantity is required"),

	frequency: z.string().min(2, "Drug frequency is required"),

	clinician_name: z.string(),
});

type LabsFormData = z.infer<typeof labsSchema>;

const RecordLabs = () => {
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
		table: "reconcile-meds",
		type: "insert",
		invalidateKey: ["reconcile-meds"],
		onSuccess: () => {
			successToast("Record added successfully.");

			handleResetTimer();

			reset();
		},
		onError: (error) => {
			errorToast(error.message);
		},
	});

	const onSubmit = async (data: LabsFormData) => {
		if (!code) {
			errorToast("Invalid signed in user.");

			redirect("/auth/sign-in");
		}

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
			participant_code: code,
			task_id: "MEDS01",
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
							Name (e.g., Atorvastatin)
						</span>

						<input
							className="input md:py-2 rounded-lg"
							type="text"
							placeholder="Enter patient's name"
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
							placeholder="Enter patient's name"
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
							placeholder="Enter patient's name"
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
							disabled={
								!isRunning ||
								!isValid ||
								isPending
							}
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

export default RecordLabs;
