import { randomBytes } from "crypto";
import { supabase } from "./supabase-client";
import { errorToast } from "./toast";

export async function generateUniqueCode(): Promise<string | null> {
	let code = "";
	let exists = true;

	while (exists) {
		code = generateCode();

		const { data, error } = await supabase
			.from("clinician")
			.select("staff_id")
			.eq("staff_id", code)
			.maybeSingle();

		if (error) {
            errorToast(error.message);

            return null;
		}

		exists = !!data;
	}

	return code;
}

const generateCode = () => {
	const prefix = "UDAIF";

	const part1 = randomString(6);

	const part2 = randomString(3);

	return `${prefix}-${part1}-${part2}`;
};

const randomString = (length: number) => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	const bytes = randomBytes(length);

	return Array.from(bytes)
		.map((b) => chars[b % chars.length])
		.join("");
}
