"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
	MenuIcon,
	XIcon,
	HomeIcon,
	HeartPulseIcon,
	TestTubeIcon,
	PillIcon,
} from "lucide-react";

const navLinks = [
	{
		name: "Dashboard",
		route: "/dashboard",
		icon: HomeIcon,
	},
	{
		name: "Record Vitals",
		route: "/dashboard/vitals",
		icon: HeartPulseIcon,
	},
	{
		name: "Order Labs",
		route: "/dashboard/labs",
		icon: TestTubeIcon,
	},
	{
		name: "Reconcile Meds",
		route: "/dashboard/meds",
		icon: PillIcon,
	},
];

const Header = () => {
	const pathname = usePathname();

	const [navIsOpen, setNavIsOpen] = useState(false);

    useEffect(() => {
        setNavIsOpen(false);
    }, [pathname]);

	return (
		<header className="sticky top-0 z-1024 w-full lg:w-1/5 bg-secondary text-white lg:h-dvh lg:fixed lg:left-0 lg:top-0">
			<div className="flex items-center justify-between gap-4 p-4 lg:hidden">
				<p className="font-poppins font-bold">MedCare</p>

				<button
					type="button"
					aria-label="Nav toggle button"
					onClick={() => setNavIsOpen(!navIsOpen)}
				>
					{navIsOpen && <XIcon strokeWidth={1.2} />}

					{!navIsOpen && <MenuIcon strokeWidth={1.2} />}
				</button>
			</div>

			<div
				className={`bg-secondary p-4 transition-transform ease-in-out duration-300 text-white absolute top-full left-0 w-full lg:translate-y-0 lg:static lg:p-0 ${
					navIsOpen ? "translate-y-0" : "-translate-y-[200%]"
				}`}
			>
				<Link
					className="font-bold font-poppins hidden lg:block border-b border-background/40 p-4"
					href="/dashboard"
				>
					MedCare
				</Link>

				<ul className="grid gap-2 lg:p-4">
					{navLinks.map((link) => (
						<li key={link.route}>
							<Link
								className={`flex items-center gap-2 p-3 rounded-lg lg:py-2 ${
									pathname === link.route
										? "bg-background/20 text-white"
										: "hover:bg-background/20 hover:text-white"
								}`}
								href={link.route}
							>
								<link.icon strokeWidth={1.2} />
								{link.name}
							</Link>
						</li>
					))}
				</ul>
			</div>
		</header>
	);
};

export default Header;
