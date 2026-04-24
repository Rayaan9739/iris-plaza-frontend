import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser, updateMyProfile } from "@/api";

export default function TenantProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    if (!token) {
      setError("Please sign in to view profile.");
      setLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const user = await getCurrentUser(token);
        if (!active) return;
        setFirstName(String(user?.firstName || ""));
        setLastName(String(user?.lastName || ""));
        setEmail(String(user?.email || ""));
        setPhone(String(user?.phone || ""));
        if (user?.dob) {
          const d = new Date(user.dob);
          setDob(d.toISOString().split("T")[0]);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();

    // Listen for profile updates from admin panel
    function handleProfileUpdated() {
      load();
    }
    window.addEventListener("rooms:updated", handleProfileUpdated);

    return () => {
      active = false;
      window.removeEventListener("rooms:updated", handleProfileUpdated);
    };
  }, []);

  const initials = useMemo(
    () =>
      `${String(firstName || "").slice(0, 1)}${String(lastName || "").slice(0, 1)}`.toUpperCase() ||
      "U",
    [firstName, lastName],
  );

  async function handleSave() {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");
    if (!token) {
      setError("Please sign in to update profile.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateMyProfile(token, {
        firstName,
        lastName,
        phone,
        dob,
      });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout type="tenant">
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <h2 className="text-2xl font-bold font-display">Profile</h2>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}
        <div className="bg-card rounded-lg border p-6 shadow-card space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
              {initials}
            </div>
            <div>
              <p className="font-semibold font-display">
                {[firstName, lastName].filter(Boolean).join(" ") || "Tenant"}
              </p>
              <p className="text-sm text-muted-foreground">{email || "-"}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                className="mt-1.5"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                className="mt-1.5"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" value={email} disabled />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                className="mt-1.5"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Date of Birth</Label>
              <Input
                className="mt-1.5"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
