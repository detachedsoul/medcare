"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { errorToast, successToast } from "@/lib/toast";
import { useQuery } from "@/hooks/use-query";

interface User {
	id: string;
	participant_code: string;
	email: string;
	password: string;
	first_name?: string | null;
	last_name?: string | null;
}

interface FormValues {
	email: string;
	password: string;
}

const SignInForm = () => {
	const { replace } = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors },
		getValues,
	} = useForm<FormValues>();

	const { error, isFetching, refetch } = useQuery<User>({
		table: "user",
		filters: [
			{
				column: "email",
				value: getValues("email")?.trim().toLowerCase(),
			},
			{
				column: "password",
				value: getValues("password"),
			},
		],
		enabled: false,
		key: ["user-login"],
	});

	const onSubmit = async () => {
		const { email, password } = getValues();

		if (!email || !password) {
			errorToast("Email and password are required.");
			return;
		}

		const res = await refetch();

		if (res.error) {
			errorToast(res.error.message);
			return;
		}

		if (!res.data || res.data.length < 1) {
			errorToast("Invalid email or password.");
			return;
		}

		const user = res.data[0];

		localStorage.setItem("clinician_code", user.participant_code);

		localStorage.setItem("clinician_first_name", user.first_name ?? "");

		localStorage.setItem("clinician_last_name", user.last_name ?? "");

		successToast(
			`Welcome${user.first_name ? `, ${user.first_name}` : ""}!`,
		);

		replace("/dashboard");
	};

	return (
		<div className="grid gap-4 w-full">
			<form
				className="grid gap-6 p-4"
				onSubmit={handleSubmit(onSubmit)}
			>
				<div className="grid gap-2">
					<span className="font-medium font-poppins">Email</span>

					<input
						className="input"
						type="email"
						placeholder="Enter your email"
						{...register("email", {
							required: "Email is required",
						})}
					/>

					{errors.email && (
						<p className="text-red text-sm">
							{errors.email.message}
						</p>
					)}
				</div>

				<div className="grid gap-2">
					<span className="font-medium font-poppins">Password</span>

					<input
						className="input"
						type="password"
						placeholder="Enter your password"
						{...register("password", {
							required: "Password is required",
						})}
					/>

					{errors.password && (
						<p className="text-red text-sm">
							{errors.password.message}
						</p>
					)}
				</div>

				{error && (
					<p className="text-red font-medium">{error.message}</p>
				)}

				<button
					className="btn"
					type="submit"
					disabled={isFetching}
				>
					{isFetching ? "Signing In..." : "Sign In"}
				</button>

				<p>
					Don’t have an account yet?{" "}
					<Link
						className="text-blue hover:underline underline-offset-4 font-medium"
						href="/auth/sign-up"
					>
						Sign up instead
					</Link>
				</p>

				<p className="-mt-2">
					Forgot your password?{" "}
					<Link
						className="text-blue hover:underline underline-offset-4 font-medium"
						href="/auth/password-reset"
					>
						Reset your password
					</Link>
				</p>
			</form>
		</div>
	);
};

export default SignInForm;
