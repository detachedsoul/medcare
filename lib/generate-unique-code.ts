import { randomBytes } from "crypto";

export function generateUniqueCode(): string {
	const code = generateCode();

	return code;
}

const generateCode = () => {
	const prefix = "UDAIF";

	const part1 = randomString(6);

	const part2 = randomString(3);

	return `${prefix}-${part1}-${part2}`;
};

export const randomString = (length: number) => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	const bytes = randomBytes(length);

	return Array.from(bytes)
		.map((b) => chars[b % chars.length])
		.join("");
}
