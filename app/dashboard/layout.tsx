"use client";

import Header from "./_components/header";
import Loading from "./loading";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import { redirect } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode; }) => {
    const { code, isLoading } = useClinicianCode();

    if (isLoading) {
        return <Loading />
    }

    if (!isLoading && !code) {
		redirect("/auth/sign-in");
	}

    return (
		<div className="lg:flex relative">
			<Header />

			<div className="w-full min-h-dvh lg:ml-[20%]">
				<div className="p-4 border-b border-gray sticky top-14 bg-background z-50 md:top-0">
					<p>Welcome back. 👋</p>

					<p>
						Your Clinician Code is: <strong>{code}</strong>
					</p>
				</div>

				<main className="p-4">{children}</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
