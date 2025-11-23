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
import React from "react";

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
	click_count: number;
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
	click_count: number;
	date: string;
	location: string;
	test_name: string;
	task_id: string;
	[key: string]: any;
}

const labsSchema = z.object({
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

	const [clickCount, setClickCount] = useState<number>(0);
	const [isCounting, setIsCounting] = useState<boolean>(false);
	const [location, setLocation] = useState("");
	const [open, setOpen] = React.useState(false);
	const [testName, setTestName] = React.useState("");

	const clickHandlerRef = useRef<(e: MouseEvent) => void>(() => {});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = useForm<LabsFormData>({
		resolver: zodResolver(labsSchema),
		mode: "onChange",
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
		onSuccess: async (data) => {
			const newRecord = data?.[0];

			successToast("Lab order recorded.");

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
							subject: "Order Labs Record Created",
							body: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>New Lab Order Record</title>
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
                        <h1>New Lab Order Record Created</h1>
                        <p>A new lab order record has been added successfully. Below are the details:</p>

                        <table>
                            <tr>
                                <th>Patient ID</th>
                                <td>${newRecord?.patient_id}</td>
                            </tr>
                            <tr>
                                <th>Test Name</th>
                                <td>${newRecord?.test_name}</td>
                            </tr>
                            <tr>
                                <th>Location</th>
                                <td>${newRecord?.location}</td>
                            </tr>
                            <tr>
                                <th>Date</th>
                                <td>${newRecord?.date}</td>
                            </tr>
                            <tr>
                                <th>Participant Code</th>
                                <td>${code}</td>
                            </tr>
                            <tr>
                                <th>Task ID</th>
                                <td>LABS01</td>
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
			} catch (err: unknown) {
				console.error("Failed to send success email:", err);
			}

			reset();
			setClickCount(0);
			setIsCounting(false);
			setTestName("");
			setLocation("");
		},
		onError: (err: any) => {
			errorToast(err.message);
		},
	});

	const onSubmit = async (data: LabsFormData): Promise<void> => {
		// stop counting before submitting
		setIsCounting(false);

		// generate patient id
		const patientId: string = generateUniqueCode();

		const payload: NewLabsPayload = {
			...data,
			patient_id: patientId,
			participant_code: code ?? "",
			task_id: "LABS01",
			location: location,
			test_name: testName,
			click_count: clickCount,
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
								<SelectTrigger className="w-full input md:py-2 rounded-lg h-full">
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
		</div>
	);
};

export default RecordLabs;
