"use client";

import {
	useMutation,
	useQueryClient,
	UseMutationResult,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";

type MutationType = "insert" | "update" | "delete";
type Filter = { column: string; value: unknown };

interface UseSupabaseMutationOptions<Row extends object> {
	table: string;
	type: MutationType;
	filters?: Filter[];
	invalidateKey?: readonly unknown[] | string;
	onSuccess?: (data: Row[] | null) => void;
	onError?: (error: Error) => void;
}

type MutationArg<Row extends object> =
	| Partial<Row>
	| { payload: Partial<Row>; filters?: Filter[] };

/**
 * Universal Supabase mutation hook (insert, update, delete)
 * Automatically invalidates related queries after success.
 */
export function useSupabaseMutation<Row extends object>(
	options: UseSupabaseMutationOptions<Row>,
): UseMutationResult<
	Row[] | null,
	Error,
	Partial<Row> | { payload: Partial<Row>; filters?: Filter[] },
	unknown
> {
	const { table, type, filters, invalidateKey, onSuccess, onError } = options;
	const qc = useQueryClient();

	const mutationFn = async (
		variables: MutationArg<Row>,
	): Promise<Row[] | null> => {
		const payload = "payload" in variables ? variables.payload : variables;

		const dynamicFilters =
			"filters" in variables ? variables.filters : undefined;

		const base = supabase.from(table);
		let response;

		const activeFilters = dynamicFilters ?? filters;

		switch (type) {
			case "insert":
				response = await base.insert(payload).select();
				break;

			case "update": {
				if (!activeFilters?.length)
					throw new Error("Update requires filters");

				let query = base.update(payload);

				for (const f of activeFilters) {
					if (Array.isArray(f.value)) {
						query = query.in(f.column, f.value);
					} else {
						query = query.eq(f.column, f.value);
					}
				}

				response = await query.select();
				break;
			}

			case "delete": {
				if (!activeFilters?.length)
					throw new Error("Delete requires filters");

				let query = base.delete();

				for (const f of activeFilters) {
					if (Array.isArray(f.value)) {
						query = query.in(f.column, f.value);
					} else {
						query = query.eq(f.column, f.value);
					}
				}

				response = await query;
				break;
			}

			default:
				throw new Error(`Unsupported mutation type: ${type}`);
		}

		if (response.error) throw response.error;
		return response.data;
	};

	return useMutation({
		mutationFn,
		onSuccess: async (data) => {
			const key = invalidateKey ?? [table];
			await qc.invalidateQueries({
				queryKey: typeof key === "string" ? [key] : key,
			});
			onSuccess?.(data ?? null);
		},
		onError,
	});
}
