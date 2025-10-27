"use client";

import { useEffect, useState } from "react";

export function useClinicianCode() {
	const [code, setCode] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const timeout = setTimeout(() => {
			const storedCode = localStorage.getItem("clinician_code") || null;

			setCode(storedCode);

			setIsLoading(false);
		}, 0);

		return () => clearTimeout(timeout);
	}, []);

	return { code, isLoading };
}
