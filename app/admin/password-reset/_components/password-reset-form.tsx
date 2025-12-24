"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { errorToast, successToast } from "@/lib/toast";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { randomString } from "@/lib/generate-unique-code";

interface Admin {
	id: string;
	email: string;
	password: string;
	first_name: string;
}

interface FormValues {
	email: string;
}

const PasswordResetForm = () => {
	const { replace } = useRouter();

	const {
		register,
		handleSubmit,
        formState: { errors },
        reset,
	} = useForm<FormValues>({ mode: "all" });

	const {
		mutate: updatePassword,
		isPending,
        error,
	} = useSupabaseMutation<Admin>({
		table: "admin",
		type: "update",
		invalidateKey: ["admin"],
        onSuccess: async (data) => {
            if (data && data?.length < 1) {
                errorToast("Incorrect email address");

                return;
            }

            successToast("Password updated successfully!");

            reset();

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
							to_email: data?.[0]?.email,
							subject: "Password Reset",
							body: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Password Reset</title>
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
                        <h1>Password Reset Successful</h1>

                        <p><span style='font-size: 20px'>Hi, ${data?.[0]?.first_name}.</span> Here's your new password as requested: <b>${data?.[0]?.password}.</b> Use it to access your dashboard.</p>

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

                setTimeout(() => {
					replace("/admin/sign-in");
				}, 300);
			} catch (err: unknown) {
				console.error("Failed to send success email:", err);
			}
		},
		onError: (err) => {
			errorToast(err.message || "Failed to update password");
		},
	});

	const onSubmit = async (data: FormValues) => {
        if (!data.email) {
			errorToast("Please enter your email address");
			return;
		}

		updatePassword({
			payload: { password: randomString(5) },
			filters: [{ column: "email", value: data.email }],
		});
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

				{error && (
					<p className="text-red font-medium">{error.message}</p>
				)}

				<button
					className="btn"
					type="submit"
					disabled={isPending}
				>
					{isPending ? "Resetting Password..." : "Reset Password"}
				</button>

				<p>
					Remembered your password?{" "}
					<Link
						className="text-blue hover:underline underline-offset-4 font-medium"
						href="/admin/sign-in"
					>
						Sign in instead
					</Link>
				</p>
			</form>
		</div>
	);
};

export default PasswordResetForm;
