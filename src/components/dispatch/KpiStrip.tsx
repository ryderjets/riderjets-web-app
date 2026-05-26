import { Activity, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import KpiCard from "./KpiCard";
import type { Schema } from "../../../amplify/data/resource";
import type { TimelineFilter } from "./PageHeader";

type Trip = Schema["Trip"]["type"];

interface Props { trips: Trip[]; timeline: TimelineFilter; reducedMotion?: boolean; }

function sumExpense(arr: Trip[]) {
  return arr.reduce((s, t) => s + (t.expense ?? 0), 0);
}

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function dateStr(d: Date) { return d.toISOString().split("T")[0]; }

function getPriorWindow(timeline: TimelineFilter): { start: string; end: string; label: string } {
  const now = new Date();
  switch (timeline) {
    case "today": {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      return { start: dateStr(d), end: dateStr(d), label: "vs yesterday" };
    }
    case "last7": {
      const end = new Date(now); end.setDate(end.getDate() - 7);
      const start = new Date(end); start.setDate(start.getDate() - 7);
      return { start: dateStr(start), end: dateStr(end), label: "vs prev 7 days" };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end   = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: dateStr(start), end: dateStr(end), label: "vs last month" };
    }
    case "last30": {
      const end = new Date(now); end.setDate(end.getDate() - 30);
      const start = new Date(end); start.setDate(start.getDate() - 30);
      return { start: dateStr(start), end: dateStr(end), label: "vs prev 30 days" };
    }
    case "last90": {
      const end = new Date(now); end.setDate(end.getDate() - 90);
      const start = new Date(end); start.setDate(start.getDate() - 90);
      return { start: dateStr(start), end: dateStr(end), label: "vs prev 90 days" };
    }
    case "last365": {
      const end = new Date(now); end.setDate(end.getDate() - 365);
      const start = new Date(end); start.setDate(start.getDate() - 365);
      return { start: dateStr(start), end: dateStr(end), label: "vs prev year" };
    }
    case "all": {
      const start = new Date(now); start.setFullYear(start.getFullYear() - 1);
      return { start: dateStr(start), end: dateStr(now), label: "vs prior year" };
    }
    default: {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      return { start: dateStr(d), end: dateStr(d), label: "vs yesterday" };
    }
  }
}

export default function KpiStrip({ trips, timeline, reducedMotion }: Props) {
  const prior = getPriorWindow(timeline);

  const priorTrips = trips.filter((t) => {
    const d = t.transactionDate ?? "";
    return d >= prior.start && d <= prior.end;
  });

  const byStatus = (arr: Trip[], s: string) => arr.filter((t) => t.status === s);
  const blocked  = (arr: Trip[]) => arr.filter((t) => t.status === "BLOCKED" || t.status === "ISSUES");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
      <KpiCard
        label="Blocked / Issues"
        expense={sumExpense(blocked(trips))}
        tripCount={blocked(trips).length}
        tripLabel="blocked"
        delta={pct(sumExpense(blocked(trips)), sumExpense(blocked(priorTrips)))}
        deltaLabel={prior.label}
        icon={<AlertTriangle size={20} strokeWidth={1.75} />}
        accentColor="hsl(0,80%,55%)"
        reducedMotion={reducedMotion}
      />
      <KpiCard
        label="Pending Payment"
        expense={sumExpense(byStatus(trips, "PENDING"))}
        tripCount={byStatus(trips, "PENDING").length}
        tripLabel="waiting"
        delta={pct(sumExpense(byStatus(trips, "PENDING")), sumExpense(byStatus(priorTrips, "PENDING")))}
        deltaLabel={prior.label}
        icon={<Clock size={20} strokeWidth={1.75} />}
        accentColor="hsl(38,92%,48%)"
        reducedMotion={reducedMotion}
      />
      <KpiCard
        label="In Progress"
        expense={sumExpense(byStatus(trips, "IN_PROGRESS"))}
        tripCount={byStatus(trips, "IN_PROGRESS").length}
        tripLabel="in transit"
        delta={pct(sumExpense(byStatus(trips, "IN_PROGRESS")), sumExpense(byStatus(priorTrips, "IN_PROGRESS")))}
        deltaLabel={prior.label}
        icon={<Activity size={20} strokeWidth={1.75} />}
        accentColor="hsl(210,90%,55%)"
        reducedMotion={reducedMotion}
      />
      <KpiCard
        label="Completed"
        expense={sumExpense(byStatus(trips, "COMPLETED"))}
        tripCount={byStatus(trips, "COMPLETED").length}
        tripLabel="completed"
        delta={pct(sumExpense(byStatus(trips, "COMPLETED")), sumExpense(byStatus(priorTrips, "COMPLETED")))}
        deltaLabel={prior.label}
        icon={<CheckCircle2 size={20} strokeWidth={1.75} />}
        accentColor="hsl(160,60%,42%)"
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
