import { useQuery as tanstackQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";

type Filter = { column: string; value: unknown };

interface UseSupabaseQueryOptions<Row> {
	table: string;
	filters?: Filter[];
	key?: readonly unknown[];
	enabled?: boolean;
}

export function useQuery<Row>({
	table,
	filters,
	key,
	enabled = true,
}: UseSupabaseQueryOptions<Row>): UseQueryResult<Row[], Error> {
	const queryKey = key ?? [table, filters];

	const fetchFn = async (): Promise<Row[]> => {
		let builder = supabase.from<string, Row>(table).select("*");

		if (filters?.length) {
			const matchObj = filters.reduce<Record<string, unknown>>(
				(acc, f) => {
					acc[f.column] = f.value;
					return acc;
				},
				{},
            );

			builder = (builder).match(matchObj);
		}

        const { data, error } = await builder;

        if (error) throw error;

		return (data ?? []) as Row[];
	};

	return tanstackQuery<Row[], Error>({
		queryKey,
		queryFn: fetchFn,
		enabled,
	});
}
