import toast from "react-hot-toast";

const successToast = (message: string) => {
	toast.success(message, {
		style: {
			backgroundColor: "#34c153",
			color: "#ffffff",
			paddingLeft: "1rem",
			paddingRight: "1rem",
		},
		icon: null,
	});
};

const errorToast = (message: string) => {
	toast.error(message, {
		style: {
			backgroundColor: "#ff0606",
			color: "#ffffff",
			paddingLeft: "1rem",
			paddingRight: "1rem",
		},
		icon: null,
	});
};

export { successToast, errorToast };
