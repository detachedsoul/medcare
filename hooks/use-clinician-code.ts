"use client";

import { generateUniqueCode } from "@/lib/generate-unique-code";
import { useEffect, useState } from "react";

export function useClinicianCode() {
	const [code, setCode] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const timeout = setTimeout(() => {
			const storedCode =
				localStorage.getItem("clinician_code") || generateUniqueCode();

			setCode(storedCode);

			setIsLoading(false);

            localStorage.setItem("clinician_code", storedCode);
		}, 0);

		return () => clearTimeout(timeout);
	}, []);

	return { code, isLoading };
}
