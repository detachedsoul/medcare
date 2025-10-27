"use client";

import Link from "next/link";
import { useState } from "react";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { generateUniqueCode } from "@/lib/generate-unique-code";
import { errorToast, successToast } from "@/lib/toast";
import { useRouter } from "next/navigation";

interface Clinician {
	id: string;
	staff_id: string;
	staff_name?: string | null;
}

const SignUpForm = () => {
	const { replace } = useRouter();

	const [name, setName] = useState("");
	const [isGeneratingCode, setIsGeneratingCode] = useState(false);

	const {
		mutate: addClinician,
		isPending,
		isError,
		error,
	} = useSupabaseMutation<Clinician>({
		table: "clinician",
		type: "insert",
		invalidateKey: ["clinician"],
        onSuccess: (data) => {
            const code = data?.[0].staff_id;

			if (code) localStorage.setItem("clinician_code", code);

			successToast("Account created successfully.");

			replace("/dashboard");
		},
		onError: (error) => {
			errorToast(error.message);
		},
	});

	const handleSubmit = async () => {
		setIsGeneratingCode(true);

		const generatedCode = await generateUniqueCode();

		if (!generatedCode) {
			errorToast("Staff ID is required");

			setIsGeneratingCode(false);

			return;
		}

		if (!generatedCode.trim()) {
			errorToast("Staff ID is required");

			setIsGeneratingCode(false);

			return;
		}

		setIsGeneratingCode(false);

		addClinician({
			staff_id: generatedCode,
			staff_name: name?.trim() || null,
		});
	};

	return (
		<div className="grid gap-4 w-full">
			<form className="grid gap-6 p-4">
				<label
					className="grid gap-2"
					htmlFor="staff-name"
				>
					<span className="text-left font-poppins">
						Name (Optional)
					</span>

					<input
						className="input"
						placeholder="Enter your name"
						id="staff-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</label>

				<button
					className="btn"
					type="button"
					disabled={isPending || isGeneratingCode}
					onClick={handleSubmit}
				>
					{isPending || isGeneratingCode
						? "Signing Up..."
						: "Sign Up"}
				</button>

				{isError && (
					<p className="text-red font-medium">
					    {error?.message || "Something went wrong"}
					</p>
				)}

				<p>
					Already have an account?{" "}
					<Link
						className="text-blue hover:underline hover:decoration-blue hover:decoration-double underline-offset-5 font-medium"
						href="/auth/sign-in"
					>
						Sign in instead
					</Link>
				</p>
			</form>
		</div>
	);
};

export default SignUpForm;
