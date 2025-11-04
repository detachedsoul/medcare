import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const ResetUser = () => {
	return (
		<Dialog>
			<form>
				<DialogTrigger asChild>
					<button
						className="btn bg-red after:border-red border-red py-2"
						type="button"
					>
						Reset User
					</button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
                        <DialogTitle>Reset User</DialogTitle>

						<DialogDescription>
							Reset the currently logged in user.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4">
						Are you sure you want to reset the currently logged in user? This action cannot be undone.
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<button
								className="btn bg-red after:border-red border-red py-2"
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem("clinician_code");

                                    window.location.reload();
                                }}
							>
								Continue
							</button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</form>
		</Dialog>
	);
}

export default ResetUser;
