import {
	HeartPulseIcon,
	TestTubeIcon,
	PillIcon,
} from "lucide-react";

const PatientCountSummary = () => {
	return (
		<div className="grid gap-4">
			<div>
				<h2 className="font-poppins font-bold text-lg">
					Quick Summary
				</h2>

				<p className="text-sm">Get a quick stats of your patients</p>
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

					<span className="font-poppins font-medium text-lg">24</span>
				</div>

				<div className="bg-blue/20 p-4 rounded-xl grid gap-4">
					<div className="flex items-center gap-2">
						<span className="rounded-xl inline-grid place-content-center p-2 bg-white">
							<TestTubeIcon strokeWidth={1.2} />
						</span>

						<h3 className="font-medium font-poppins">Order Labs</h3>
					</div>

					<span className="font-poppins font-medium text-lg">24</span>
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

					<span className="font-poppins font-medium text-lg">24</span>
				</div>
			</div>
		</div>
	);
};

export default PatientCountSummary;
