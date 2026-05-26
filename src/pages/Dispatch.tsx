import { useEffect, useState, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import { fetchUserAttributes } from "aws-amplify/auth";
import type { Schema } from "../../amplify/data/resource";
import DispatchShell from "../components/dispatch/DispatchShell";
import PageHeader from "../components/dispatch/PageHeader";
import type { TimelineFilter } from "../components/dispatch/PageHeader";
import KpiStrip from "../components/dispatch/KpiStrip";
import OrdersToolbar from "../components/dispatch/OrdersToolbar";
import OrdersTable from "../components/dispatch/OrdersTable";
import OrderSheet from "../components/dispatch/OrderSheet";
import type { TripInput } from "../components/dispatch/OrderSheet";
import type { NavId } from "../components/dispatch/SideNav";
import type { TripStatus } from "../components/dispatch/StatusBadge";
import type { ViewMode } from "../components/dispatch/OrdersToolbar";

type Trip = Schema["Trip"]["type"];

interface Props { onSignOut: () => void; onNavChange?: (id: NavId) => void; }

export default function Dispatch({ onSignOut, onNavChange }: Props) {
  const client = generateClient<Schema>();

  const [trips, setTrips]           = useState<Trip[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [userEmail, setUserEmail]   = useState<string>();
  const [activeNav, setActiveNav]   = useState<NavId>("dispatch");
  const [search, setSearch]         = useState("");
  const [filters, setFilters]       = useState<TripStatus[]>([]);
  const [viewMode, setViewMode]     = useState<ViewMode>("table");
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [editTrip, setEditTrip]     = useState<Trip | null>(null);
  const [page, setPage]             = useState(0);
  const [timeline, setTimeline]     = useState<TimelineFilter>("today");
  const PAGE_SIZE = 25;

  useEffect(() => {
    fetchUserAttributes().then((a) => { if (a.email) setUserEmail(a.email); });

    const sub = client.models.Trip.observeQuery({ authMode: "apiKey" }).subscribe({
      next: (data) => { setTrips([...data.items]); setLoading(false); },
      error: (err) => { console.error("Trip query error:", err); setError("Failed to load orders."); setLoading(false); },
    });
    return () => sub.unsubscribe();
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  async function handleSave(data: TripInput) {
    if (editTrip) {
      await client.models.Trip.update({
        id: editTrip.id,
        ...data,
        dateUpdated: new Date().toISOString(),
      }, { authMode: "apiKey" });
    } else {
      await client.models.Trip.create({
        ...data,
        dateUpdated: new Date().toISOString(),
      }, { authMode: "apiKey" });
    }
    setSheetOpen(false);
    setEditTrip(null);
  }

  async function handleDelete(id: string) {
    await client.models.Trip.delete({ id }, { authMode: "apiKey" });
  }

  function openNew()          { setEditTrip(null);  setSheetOpen(true); }
  function openEdit(t: Trip)  { setEditTrip(t);     setSheetOpen(true); }

  const toggleFilter = (s: TripStatus) =>
    setFilters((f) => f.includes(s) ? f.filter((x) => x !== s) : [...f, s]);

  function getTimelineTrips() {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    if (timeline === "today") return trips.filter((t) => t.transactionDate === todayStr);
    const cutoff = new Date(now);
    if (timeline === "last7")  cutoff.setDate(now.getDate() - 7);
    if (timeline === "last30") cutoff.setDate(now.getDate() - 30);
    if (timeline === "last90") cutoff.setDate(now.getDate() - 90);
    if (timeline === "last365") cutoff.setDate(now.getDate() - 365);
    if (timeline === "month")  cutoff.setDate(1);
    if (timeline === "all") return trips;
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return trips.filter((t) => (t.transactionDate ?? "") >= cutoffStr);
  }

  const timelineTrips = getTimelineTrips();

  const filtered = timelineTrips.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      t.orderNumber.toLowerCase().includes(q) ||
      (t.driverName ?? "").toLowerCase().includes(q) ||
      (t.vendor ?? "").toLowerCase().includes(q) ||
      (t.driverPhone ?? "").includes(q);
    const matchFilter = filters.length === 0 || filters.includes(t.status as TripStatus);
    return matchSearch && matchFilter;
  });

  return (
    <DispatchShell activeNav={activeNav} onNavChange={(id) => { setActiveNav(id); onNavChange?.(id); }} userEmail={userEmail} onSignOut={onSignOut}>
      <PageHeader onNewOrder={openNew} timeline={timeline} onTimeline={setTimeline} />

      <KpiStrip trips={timelineTrips} timeline={timeline} />

      <OrdersToolbar
        search={search} onSearch={(v) => { setSearch(v); setPage(0); }}
        activeFilters={filters} onToggleFilter={toggleFilter}
        viewMode={viewMode} onViewMode={setViewMode}
        onRefresh={refresh} refreshing={refreshing}
      />

      <OrdersTable
        trips={filtered} loading={loading} error={error}
        onRetry={() => { setError(null); setLoading(true); }}
        onRowClick={openEdit}
        onEdit={openEdit}
        onDelete={handleDelete}
        onNewOrder={openNew}
        page={page} pageSize={PAGE_SIZE} onPage={setPage}
      />

      <OrderSheet
        open={sheetOpen}
        trip={editTrip}
        onClose={() => { setSheetOpen(false); setEditTrip(null); }}
        onSave={handleSave}
      />
    </DispatchShell>
  );
}
