import { Activity, CheckCircle2, Truck, AlertTriangle } from "lucide-react";
import KpiCard from "./KpiCard";
import type { Schema } from "../../../amplify/data/resource";

type Trip = Schema["Trip"]["type"];

interface Props { trips: Trip[]; reducedMotion?: boolean; }

function pct(today: number, yesterday: number): number {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

export default function KpiStrip({ trips, reducedMotion }: Props) {
  const todayStr     = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const today     = trips.filter((t) => t.transactionDate === todayStr);
  const yesterday = trips.filter((t) => t.transactionDate === yesterdayStr);

  const count = (arr: Trip[], status: string) => arr.filter((t) => t.status === status).length;
  const countIssues = (arr: Trip[]) => arr.filter((t) => t.status === "BLOCKED" || t.status === "ISSUES").length;

  const active    = trips.filter((t) => t.status === "IN_PROGRESS").length;
  const completed = today.filter((t) => t.status === "COMPLETED").length;
  const pending   = trips.filter((t) => t.status === "PENDING").length;
  const issues    = countIssues(trips);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
      <KpiCard label="In Progress"      value={active}    delta={pct(count(today, "IN_PROGRESS"), count(yesterday, "IN_PROGRESS"))}  icon={<Activity      size={20} strokeWidth={1.75} />} reducedMotion={reducedMotion} />
      <KpiCard label="Completed Today"  value={completed} delta={pct(completed, count(yesterday, "COMPLETED"))}                       icon={<CheckCircle2  size={20} strokeWidth={1.75} />} reducedMotion={reducedMotion} />
      <KpiCard label="Pending"          value={pending}   delta={pct(count(today, "PENDING"), count(yesterday, "PENDING"))}           icon={<Truck         size={20} strokeWidth={1.75} />} reducedMotion={reducedMotion} />
      <KpiCard label="Blocked / Issues" value={issues}    delta={pct(countIssues(today), countIssues(yesterday))}                     icon={<AlertTriangle size={20} strokeWidth={1.75} />} reducedMotion={reducedMotion} />
    </div>
  );
}
