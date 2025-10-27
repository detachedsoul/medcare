import QueryProvider from "@/providers/query-provider";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import { Urbanist, Poppins } from "next/font/google";
import "./globals.css";

const urbanist = Urbanist({
	variable: "--font-urbanist",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: "MedCare",
	description: "MedCare Demo App",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${urbanist.variable} ${poppins.variable} antialiased font-urbanist bg-background text-primary break-words [word-break:break-word] [word-wrap:break-word]`}
			>
				<QueryProvider>{children}</QueryProvider>
				<Toaster containerClassName="z-[9999]" />
			</body>
		</html>
	);
}
