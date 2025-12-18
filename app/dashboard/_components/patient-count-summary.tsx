"use client";

import { useClinicianCode } from "@/hooks/use-clinician-code";
import { useQuery } from "@/hooks/use-query";
import { exportAllToExcel, RecordData } from "@/lib/export-all";
import {
	HeartPulseIcon,
	TestTubeIcon,
	PillIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

const PatientCountSummary = () => {
    const { replace } = useRouter();

    const { code, isLoading } = useClinicianCode();

	const { data, isFetching } = useQuery({
		table: "vitals",
		filters: [{ column: "staff_id", value: code }],
		enabled: !isLoading,
		key: ["vitals"],
    });

    const { data: labsData, isFetching: labsIsFetching } = useQuery({
		table: "order-labs",
		filters: [{ column: "participant_code", value: code }],
		enabled: !isLoading,
		key: ["order-labs"],
    });

    const { data: medsData, isFetching: medsIsFetching } = useQuery({
		table: "reconcile-meds",
		filters: [{ column: "participant_code", value: code }],
		enabled: !isLoading,
		key: ["reconcile-meds"],
    });

	return (
		<div className="grid gap-4">
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div>
					<h2 className="font-poppins font-bold text-lg">
						Quick Summary
					</h2>

					<p className="text-sm">
						Get a quick stats of your patients
					</p>
				</div>

				<div className="flex items-center gap-4 flex-wrap">
					<button
						className="btn py-2"
						onClick={() =>
							exportAllToExcel(
								(data as RecordData[]) || [],
								(medsData as RecordData[]) || [],
								(labsData as RecordData[]) || [],
							)
						}
						disabled={
							isFetching || labsIsFetching || medsIsFetching
						}
						type="button"
					>
						Export All to Excel
					</button>

					<button
						className="btn bg-red after:border-red border-red py-2"
						type="button"
                        onClick={() => {
                            localStorage.removeItem("clinician_code");

                            replace("/auth/sign-in");
                        }}
					>
						Logout
					</button>
				</div>
			</div>

			<div className="bg-white p-2 rounded-2xl grid gap-4 grid-cols-2 md:grid-cols-3">
				<div className="bg-red/20 p-4 rounded-xl grid gap-4">
					<div className="flex items-center gap-2">
						<span className="rounded-xl inline-grid place-content-center p-2 bg-white">
							<HeartPulseIcon strokeWidth={1.2} />
						</span>

						<h3 className="font-medium font-poppins">
							Core Vitals
						</h3>
					</div>

					{isFetching ? (
						<div className="bg-white animate-pulse rounded-xl p-2 w-1/5" />
					) : (
						<span className="font-poppins font-medium text-lg">
							{(data && data?.length) || 0}
						</span>
					)}
				</div>

				<div className="bg-blue/20 p-4 rounded-xl grid gap-4">
					<div className="flex items-center gap-2">
						<span className="rounded-xl inline-grid place-content-center p-2 bg-white">
							<TestTubeIcon strokeWidth={1.2} />
						</span>

						<h3 className="font-medium font-poppins">Order Labs</h3>
					</div>

					{labsIsFetching ? (
						<div className="bg-white animate-pulse rounded-xl p-2 w-1/5" />
					) : (
						<span className="font-poppins font-medium text-lg">
							{(labsData && labsData?.length) || 0}
						</span>
					)}
				</div>

				<div className="bg-green/20 p-4 rounded-xl grid gap-4 max-md:col-span-2 max-md:mx-auto">
					<div className="flex items-center gap-2">
						<span className="rounded-xl inline-grid place-content-center p-2 bg-white">
							<PillIcon strokeWidth={1.2} />
						</span>

						<h3 className="font-medium font-poppins">
							Reconcile Meds
						</h3>
					</div>

					{medsIsFetching ? (
						<div className="bg-white animate-pulse rounded-xl p-2 w-1/5" />
					) : (
						<span className="font-poppins font-medium text-lg">
							{(medsData && medsData?.length) || 0}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};

export default PatientCountSummary;
