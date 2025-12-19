"use client";

import Loading from "@/app/dashboard/loading";
import { useQuery } from "@/hooks/use-query";
import { useClinicianCode } from "@/hooks/use-clinician-code";
import { useSupabaseMutation } from "@/hooks/use-mutation";
import { successToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Meds {
	id: string;
	participant_code: string;
	patient_name: string;
	click_count: number;
	duration: number;
	clinician_name: string;
	task_id: string;
	drug_name: string;
	drug_strength: string;
	frequency: string;
	is_active: boolean;
}

const MedicationListing = () => {
	const { code, isLoading } = useClinicianCode();

	const { data, error, isFetching } = useQuery<Meds>({
		table: "reconcile-meds",
		filters: [{ column: "participant_code", value: code }],
		enabled: !isLoading,
		key: ["reconcile-meds"],
	});

	const {
		mutate: editMedStatus,
		isPending,
		error: editError,
	} = useSupabaseMutation<Meds>({
		table: "reconcile-meds",
		type: "update",
		invalidateKey: ["reconcile-meds"],
		onSuccess: () => {
			successToast("Record(s) updated successfully.");
		},
	});

	if (isFetching || isPending) {
		return <Loading />;
	}

	if (data && data?.length < 1) {
		return null;
	}

	return (
		<div className="overflow-x-auto bg-white p-4 rounded-xl space-y-4">
			<div className="flex gap-4 flex-wrap items-center justify-between">
				<h2 className="text-lg font-semibold">
					Current Medication List
				</h2>
			</div>

			{data && data.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2">
					{data &&
						data.map((med) => (
							<div
								className="bg-white p-4 rounded-2xl border border-gray/50 flex items-center justify-between"
								key={med.id}
							>
								<div>
									<p className="font-medium">
										{med.drug_name}&mdash;{med.drug_strength}
									</p>

									<p
										className={cn("text-green text-sm", {
											"text-red": !med.is_active,
										})}
									>
										Status:{" "}
										{med.is_active ? "Active" : "Stopped"}
									</p>
								</div>

								<button
									className={cn(
										"btn rounded-2xl after:rounded-2xl bg-green after:border-green border-green",
										{
											"bg-red after:border-red border-red":
												!med.is_active,
										},
									)}
									type="button"
									onClick={() =>
										editMedStatus({
											payload: {
												is_active: !med.is_active,
											},
											filters: [
												{
													column: "participant_code",
													value: code,
												},
												{ column: "id", value: med.id },
											],
										})
									}
								>
									{med.is_active ? "Stop" : "Start"}
								</button>
							</div>
						))}
				</div>
			)}

			{(error || editError) && (
				<p className="text-red font-medium">
					{error?.message || editError?.message}
				</p>
			)}
		</div>
	);
};

export default MedicationListing;
