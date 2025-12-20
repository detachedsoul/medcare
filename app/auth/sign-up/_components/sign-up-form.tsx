"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { generateUniqueCode } from "@/lib/generate-unique-code";
import { errorToast, successToast } from "@/lib/toast";

interface User {
	id: string;
	participant_code: string;
	first_name: string;
	last_name: string;
	email: string;
	password: string;
}

const signUpSchema = z.object({
	first_name: z.string().min(1, "First name is required"),
	last_name: z.string().min(1, "Last name is required"),
	email: z.email("Invalid email address"),
	password: z.string().min(5, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof signUpSchema>;

const SignUpForm = () => {
	const { replace } = useRouter();

	const {
		register,
		handleSubmit,
        reset,
        watch,
		formState: { errors, isSubmitting, isValid },
	} = useForm<FormValues>({
		resolver: zodResolver(signUpSchema),
        mode: "all",
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            password: "",
        },
	});

	const {
		mutate: addUser,
		isPending,
		isError,
		error,
	} = useSupabaseMutation<User>({
		table: "user",
		type: "insert",
		invalidateKey: ["user"],
		onSuccess: (data) => {
			const participantId = data?.[0]?.participant_code;

			if (participantId) {
				localStorage.setItem("clinician_code", participantId);

				localStorage.setItem("clinician_first_name", watch("first_name"));

				localStorage.setItem("clinician_last_name", watch("last_name"));
			}

			successToast("Account created successfully.");
            reset();
			replace("/dashboard");
		},
		onError: (error) => {
            if (error.message.includes("duplicate")) {
                errorToast("An account with this email already exists.");
                return;
            }

			errorToast(error.message);
		},
	});

	const onSubmit = async (values: FormValues) => {
		const participant_code = generateUniqueCode();

		if (!participant_code) {
			errorToast("Participant ID is required");
			return;
		}

		addUser({
			participant_code,
			first_name: values.first_name.trim(),
			last_name: values.last_name.trim(),
			email: values.email.toLowerCase().trim(),
			password: values.password,
		});
	};

	return (
		<div className="grid gap-4 w-full">
			<form
				className="grid gap-5 items-start p-4 md:grid-cols-2"
				onSubmit={handleSubmit(onSubmit)}
			>
				<label
					className="grid gap-2"
					htmlFor="first_name"
				>
					<span className="font-medium font-poppins">Enter Your First Name</span>

					<input
						className="input"
						placeholder="First name"
						{...register("first_name")}
						id="first_name"
					/>

					{errors.first_name && (
						<p className="text-red text-sm">
							{errors.first_name.message}
						</p>
					)}
				</label>

				<label
					className="grid gap-2"
					htmlFor="last_name"
				>
					<span className="font-medium font-poppins">Enter Your Last Name</span>

					<input
						className="input"
						placeholder="Last name"
						{...register("last_name")}
						id="last_name"
					/>

					{errors.last_name && (
						<p className="text-red text-sm">
							{errors.last_name.message}
						</p>
					)}
				</label>

				<label
					className="grid gap-2"
					htmlFor="email"
				>
					<span className="font-medium font-poppins">Enter Your Email</span>

					<input
						className="input"
						type="email"
						placeholder="Email"
						{...register("email")}
						id="email"
					/>

					{errors.email && (
						<p className="text-red text-sm">
							{errors.email.message}
						</p>
					)}
				</label>

				<label
					className="grid gap-2"
					htmlFor="password"
				>
					<span className="font-medium font-poppins">Enter Your Password</span>

					<input
						className="input"
						type="password"
						placeholder="Password"
						{...register("password")}
						id="password"
					/>

					{errors.password && (
						<p className="text-red text-sm">
							{errors.password.message}
						</p>
					)}
				</label>

				<button
					className="btn md:col-span-2"
					type="submit"
					disabled={isPending || isSubmitting || !isValid}
				>
					{isPending || isSubmitting ? "Signing Up..." : "Sign Up"}
				</button>

				{isError && (
					<p className="text-red font-medium md:col-span-2">
						{error?.message || "Something went wrong"}
					</p>
				)}

				<p className="md:col-span-2 text-center">
					Already have an account?{" "}
					<Link
						className="text-blue hover:underline underline-offset-4 font-medium"
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
