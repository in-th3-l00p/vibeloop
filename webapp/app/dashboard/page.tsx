import { currentUser } from "@clerk/nextjs/server";
import { italianno } from "../fonts";
import { DashboardShell } from "./dashboard-shell";
import { DashboardSections } from "./dashboard-sections";

export default async function Dashboard() {
  const user = await currentUser();

  return (
    <DashboardShell
      user={{
        username: user?.username ?? "player",
        fullName: user?.fullName ?? "Anonymous Player",
        imageUrl: user?.imageUrl ?? "",
        firstName: (user?.fullName ?? "Anonymous").split(" ")[0],
      }}
      italiannoClass={italianno.className}
    >
      <DashboardSections />
    </DashboardShell>
  );
}
