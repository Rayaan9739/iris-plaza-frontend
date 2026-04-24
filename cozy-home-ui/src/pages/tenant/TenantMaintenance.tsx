import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { createMaintenanceTicket, getMyMaintenanceTickets } from "@/api";

function normalizeCategory(value: string) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
}

export default function TenantMaintenance() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [description, setDescription] = useState("");

  const descriptionOptionsByCategory: Record<string, string[]> = {
    PLUMBING: ["Water leakage", "Tap not working", "Drain blockage"],
    ELECTRICAL: ["Power outage", "Light not working", "Switch issue"],
    HVAC: ["AC not cooling", "AC leakage", "Noisy unit"],
    CLEANING: ["Deep cleaning", "Regular cleaning", "Sanitization"],
    GENERAL: ["Furniture repair", "Door/window issue", "General maintenance"],
    OTHER: ["Pest control", "Cleaning issue", "General maintenance"],
  };

  const normalizedCategory = normalizeCategory(category);
  const descriptionOptions =
    descriptionOptionsByCategory[normalizedCategory] ||
    descriptionOptionsByCategory.OTHER;

  async function loadTickets() {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    if (!token) {
      setError("Please sign in to view maintenance.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await getMyMaintenanceTickets(token);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load maintenance tickets",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  useEffect(() => {
    if (!descriptionOptions.includes(description)) {
      setDescription(descriptionOptions[0] || "");
    }
  }, [normalizedCategory]);

  async function handleSubmit() {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    if (!token) {
      setError("Please sign in to submit request.");
      return;
    }

    // Normalize category: "Money Reduction" -> "MONEY_REDUCTION"
    const rawCategory = category;
    const normalizedCat = String(rawCategory || "")
      .trim()
      .replace(/\s+/g, "_")
      .toUpperCase();

    const trimmedTitle = String(title || "").trim();
    const trimmedDescription = String(description || "").trim();

    if (!trimmedTitle || !normalizedCat) {
      setError("Please fill required fields");
      return;
    }
    if (!trimmedDescription) {
      setError("Description is required.");
      return;
    }

    // Build payload WITHOUT priority field
    const payload: Record<string, any> = {
      title: trimmedTitle,
      category: normalizedCat,
      description: trimmedDescription,
    };
    try {
      setError("");
      await createMaintenanceTicket(token, payload);
      setTitle("");
      setDescription("");
      setCategory("Plumbing");
      setShowForm(false);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    }
  }

  return (
    <DashboardLayout type="tenant">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display">
            Maintenance Requests
          </h2>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </>
            )}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {showForm && (
          <div className="bg-card rounded-lg border p-6 shadow-card animate-fade-in">
            <h3 className="font-semibold font-display mb-4">
              Submit a Request
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Brief description"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="mt-1.5 w-full rounded-md border bg-card px-3 py-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>HVAC</option>
                  <option>Cleaning</option>
                  <option>General</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label>Brief Description</Label>
                <select
                  className="mt-1.5 w-full rounded-md border bg-card px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                >
                  {descriptionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleSubmit}>Submit Request</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          )}
          {!loading &&
            tickets.map((ticket) => {
              const priorityValue = String(
                ticket.priority || "MEDIUM",
              ).toLowerCase();
              const statusValue = String(ticket.status || "OPEN")
                .toLowerCase()
                .replace("_", "-");
              return (
                <div
                  key={ticket.id}
                  className="bg-card rounded-lg border p-5 shadow-card hover-lift"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">{ticket.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {ticket.description}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <StatusBadge variant={priorityValue as any}>
                          {priorityValue}
                        </StatusBadge>
                        <StatusBadge variant={statusValue as any}>
                          {statusValue}
                        </StatusBadge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleDateString("en-IN")
                        : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </DashboardLayout>
  );
}
