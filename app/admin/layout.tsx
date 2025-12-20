"use client";

import Header from "./_components/header";
import Loading from "./loading";
import { useAdminCode } from "@/hooks/use-admin-code";
import { redirect, usePathname } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
	const pathname = usePathname();

	const { code, isLoading } = useAdminCode();

	if (
		pathname !== "/admin/sign-in" &&
		pathname !== "/admin/sign-up" &&
		pathname !== "/admin/password-reset" &&
		isLoading
	) {
		return <Loading />;
	}

	if (
		pathname !== "/admin/sign-in" &&
		pathname !== "/admin/sign-up" &&
		pathname !== "/admin/password-reset" &&
		!isLoading &&
		!code
	) {
		redirect("/admin/sign-in");
	}

	if (
		pathname === "/admin/sign-in" ||
		pathname === "/admin/sign-up" ||
		pathname === "/admin/password-reset"
	) {
		return (
			<div className="h-dvh grid place-content-center">{children}</div>
		);
	}

	return (
		<div className="lg:flex relative">
			<Header />

			<div className="w-full min-h-dvh lg:ml-[20%]">
				<div className="p-4 border-b border-gray sticky top-14 bg-background z-50 md:top-0">
					<p>Welcome back. 👋</p>

					<p>
						Your Admin Code is: <strong>{code}</strong>
					</p>
				</div>

				<main className="p-4">{children}</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
