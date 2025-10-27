"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { errorToast, successToast } from "@/lib/toast";
import { useQuery } from "@/hooks/use-query";

interface Clinician {
	id: string;
	staff_id: string;
	staff_name?: string | null;
}

const SignInForm = () => {
	const { replace } = useRouter();

	const [staffId, setStaffId] = useState("");

	const { data, error, isFetching, refetch } = useQuery<Clinician>({
		table: "clinician",
		filters: [{ column: "staff_id", value: staffId.trim() }],
		enabled: false,
		key: ["clinician", staffId],
	});

	useEffect(() => {
		if (!staffId.trim()) return;

		if (error) {
			errorToast(error.message);
			return;
		}

		if (data && data.length < 1) {
            errorToast("Invalid Staff ID. Please check and try again.");

			return;
		}

		if (data && data.length > 0) {
			const clinician = data[0];

			localStorage.setItem("clinician_code", clinician.staff_id);

			successToast(
				`Welcome ${
					clinician.staff_name ? `, ${clinician.staff_name}` : ""
				}!`,
			);

			replace("/dashboard");
		}
	}, [data, error, staffId, replace]);

	return (
		<div className="grid gap-4 w-full">
			<form className="grid gap-6 p-4">
				<label
					className="grid gap-2"
					htmlFor="staff-id"
				>
					<span className="text-left font-poppins">Staff ID</span>

					<input
						className="input"
						placeholder="Enter your staff ID"
						id="staff-id"
						value={staffId}
						onChange={(e) => setStaffId(e.target.value)}
					/>

					{(error || (data && data.length < 1)) && (
						<p className="text-red font-medium">
							{error?.message || "Incorrect staff ID"}
						</p>
					)}
				</label>

				<button
					className="btn"
					type="button"
					onClick={() => {
						if (!staffId.trim()) {
							errorToast("Please enter your Staff ID.");
							return;
						}
						refetch();
					}}
					disabled={isFetching || staffId.trim().length < 6}
				>
					{isFetching ? "Signing In..." : "Sign In"}
				</button>

				<p>
					Don’t have an account yet?{" "}
					<Link
						className="text-blue hover:underline hover:decoration-blue hover:decoration-double underline-offset-5 font-medium"
						href="/auth/sign-up"
					>
						Sign up instead
					</Link>
				</p>
			</form>
		</div>
	);
};

export default SignInForm;
