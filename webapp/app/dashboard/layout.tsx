import { currentUser } from "@clerk/nextjs/server";
import { italianno } from "../fonts";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  return (
    <DashboardShell
      clerkUser={{
        username: user?.username ?? "player",
        fullName: user?.fullName ?? "Anonymous Player",
        imageUrl: user?.imageUrl ?? "",
        firstName: (user?.fullName ?? "Anonymous").split(" ")[0],
      }}
      italiannoClass={italianno.className}
    >
      {children}
    </DashboardShell>
  );
}
