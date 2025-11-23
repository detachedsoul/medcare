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

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = useForm<MedsFormData>({
		resolver: zodResolver(MedsSchema),
		mode: "all",
	});

	const [clickCount, setClickCount] = useState<number>(0);
	const [isCounting, setIsCounting] = useState<boolean>(false);
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
            `,
                    },
                }),
            });
        } catch {
            errorToast("Form contains errors. They have been emailed.");
        }
    };

    // Supabase insert
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

            // Send success email (includes click_count)
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
                <h1>New Medication Record Created</h1>
                <table>
                  <tr><th>Patient ID</th><td>${newRecord?.patient_id}</td></tr>
                  <tr><th>Drug Name</th><td>${newRecord?.drug_name}</td></tr>
                  <tr><th>Drug Strength</th><td>${
                        newRecord?.drug_strength
                    }</td></tr>
                  <tr><th>Frequency</th><td>${newRecord?.frequency}</td></tr>
                  <tr><th>Participant Code</th><td>${code}</td></tr>
                  <tr><th>Task ID</th><td>MEDS01</td></tr>
                  <tr><th>Click Count</th><td>${
                        newRecord?.click_count ?? clickCount
                    }</td></tr>
                </table>
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
        },
        onError: (err: any) => {
            errorToast(err.message);
        },
    });

    // Final submit handler — no timer, click_count included
    const onSubmit = async (data: MedsFormData): Promise<void> => {
        // stop counting before submitting
        setIsCounting(false);

        // generate patient id
        const patientId: string =
            generateUniqueCode();

        const payload: NewMedsPayload = {
            ...data,
            patient_id: patientId,
            participant_code: code ?? "",
            task_id: "MEDS01",
            click_count: clickCount,
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
