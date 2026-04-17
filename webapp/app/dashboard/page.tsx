import { currentUser } from "@clerk/nextjs/server";
import { italianno } from "../fonts";
import { DashboardShell } from "./dashboard-shell";
import { DashboardSections } from "./dashboard-sections";

export default async function Dashboard() {
  const user = await currentUser();

  const username = user?.username ?? "player";
  const fullName = user?.fullName ?? "Anonymous Player";
  const imageUrl = user?.imageUrl ?? "";

  return (
    <DashboardShell>
      <DashboardSections
        username={username}
        fullName={fullName}
        imageUrl={imageUrl}
        italiannoClass={italianno.className}
      />
    </DashboardShell>
  );
}
