"use client";

import { useEffect, useState } from "react";

export function useAdminCode() {
	const [code, setCode] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const timeout = setTimeout(() => {
			const storedCode =
				localStorage.getItem("admin_code");

            if (storedCode) {
                setCode(storedCode);

                localStorage.setItem("admin_code", storedCode);
            }

            setIsLoading(false);
		}, 0);

		return () => clearTimeout(timeout);
	}, []);

	return { code, isLoading };
}
