import { LoaderIcon } from "lucide-react";

const Loading = () => {
	return (
		<div className="h-dvh grid place-content-center p-4">
			<LoaderIcon
				className="animate-spin"
				size={50}
				strokeWidth={1.2}
			/>
		</div>
	);
};

export default Loading;
