import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signUp } from "@/api";
import { getCurrentUserRole, isAuthenticated, persistToken } from "@/lib/auth";

interface AuthPageProps {
  mode: "login" | "signup";
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDobValue] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showSavePasswordModal, setShowSavePasswordModal] = useState(false);
  const [pendingPassword, setPendingPassword] = useState("");

  // Identity details state
  const [fatherName, setFatherName] = useState("");
  const [relation, setRelation] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [gender, setGender] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [collegeName, setCollegeName] = useState("");

  const titles = {
    login: "Welcome back",
    signup: "Create your account",
  };
  const subtitles = {
    login: "Sign in with your phone number and date of birth",
    signup: "Get started with Iris Plaza today",
  };

  const isSignup = mode === "signup";

  useEffect(() => {
    if ((mode === "signup" || mode === "login") && isAuthenticated()) {
      const redirectPath = getCurrentUserRole() === "ADMIN" ? "/admin" : "/";
      navigate(redirectPath, { replace: true });
    }
  }, [mode, navigate]);

  // Load saved credentials (phone, dob, and password if available)
  useEffect(() => {
    if (mode === "login") {
      const savedPhone = localStorage.getItem("iris_plaza_saved_phone");
      const savedDob = localStorage.getItem("iris_plaza_saved_dob");
      const savedPassword = localStorage.getItem("iris_plaza_saved_password");
      const wasRemembered = localStorage.getItem("iris_plaza_remember_me") === "true";

      if (savedPhone) setPhone(savedPhone);
      if (savedDob) setDobValue(savedDob);
      if (savedPassword) setPassword(savedPassword);
      if (wasRemembered) setRememberMe(true);
    }
  }, [mode]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!dob) {
      setError("Date of Birth is required.");
      return;
    }

    try {
      setLoading(true);

      if (isSignup) {
        const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
        if (nameParts.length < 2) {
          setError("Please enter first and last name.");
          return;
        }
        const [firstName, ...rest] = nameParts;
        const lastName = rest.join(" ");

        await signUp({
          phone,
          email: email || undefined,
          firstName,
          lastName,
          dob,
          fatherName: fatherName || undefined,
          relation: relation || undefined,
          aadhaarNumber: aadhaarNumber || undefined,
          gender: gender || undefined,
          tenantAddress: tenantAddress || undefined,
          collegeName: collegeName || undefined,
        });

        setSuccess("Signup successful.");
        return;
      }

      // Handle "Remember me" for login
      if (rememberMe) {
        localStorage.setItem("iris_plaza_saved_phone", phone);
        localStorage.setItem("iris_plaza_saved_dob", dob);
        localStorage.setItem("iris_plaza_remember_me", "true");
      } else {
        localStorage.removeItem("iris_plaza_saved_phone");
        localStorage.removeItem("iris_plaza_saved_dob");
        localStorage.removeItem("iris_plaza_remember_me");
      }

      const result = await login({ phone, dob });
      if (!result?.accessToken) {
        setError(result?.message || "Invalid phone number or date of birth.");
        return;
      }

      persistToken(result.accessToken);
      if (result?.refreshToken) {
        localStorage.setItem("refreshToken", result.refreshToken);
      }
      if (result?.user) {
        localStorage.setItem("current_user", JSON.stringify(result.user));
        localStorage.setItem("user_role", String(result.user.role || ""));
      }

      // Show save password modal instead of immediately redirecting
      setPendingPassword(dob);
      setShowSavePasswordModal(true);
      setSuccess(result?.message || "Login successful.");
      return;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSavePassword() {
    localStorage.setItem("iris_plaza_saved_phone", phone);
    localStorage.setItem("iris_plaza_saved_dob", pendingPassword);
    localStorage.setItem("iris_plaza_saved_password", pendingPassword);
    localStorage.setItem("iris_plaza_remember_me", "true");
    setShowSavePasswordModal(false);
    
    // Redirect after saving
    const role = getCurrentUserRole();
    const redirectPath = role === "ADMIN" ? "/admin" : "/";
    window.location.href = redirectPath;
  }

  function handleSkipSavePassword() {
    // Clear saved password if user chooses not to save
    localStorage.removeItem("iris_plaza_saved_password");
    setShowSavePasswordModal(false);
    
    // Redirect without saving
    const role = getCurrentUserRole();
    const redirectPath = role === "ADMIN" ? "/admin" : "/";
    window.location.href = redirectPath;
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/90 to-accent-foreground items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold font-display">Iris Plaza</span>
          </div>
          <h2 className="text-3xl font-bold font-display mb-4">
            Manage your rentals with ease
          </h2>
          <p className="text-primary-foreground/80 leading-relaxed">
            From finding the perfect room to managing your tenancy, Iris Plaza
            makes property management seamless.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">Iris Plaza</span>
          </Link>

          <h1 className="text-2xl font-bold font-display mb-1">
            {titles[mode]}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {subtitles[mode]}
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignup && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="mt-1.5"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="username"
                placeholder="+1234567890"
                className="mt-1.5"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {isSignup && (
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  className="mt-1.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            {/* Identity Details Section - Only for signup */}
            {isSignup && (
              <>
                <div className="pt-2">
                  <Label className="text-sm font-medium">
                    Identity Details
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fatherName" className="text-xs">
                      Father Name
                    </Label>
                    <Input
                      id="fatherName"
                      placeholder="John Smith"
                      className="mt-1"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relation" className="text-xs">
                      Relation
                    </Label>
                    <select
                      id="relation"
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="S/O">S/O</option>
                      <option value="D/O">D/O</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="aadhaarNumber" className="text-xs">
                      Aadhaar Number
                    </Label>
                    <Input
                      id="aadhaarNumber"
                      placeholder="1234 5678 9012"
                      className="mt-1"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender" className="text-xs">
                      Gender
                    </Label>
                    <select
                      id="gender"
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tenantAddress" className="text-xs">
                    Address
                  </Label>
                  <Input
                    id="tenantAddress"
                    placeholder="Your address"
                    className="mt-1"
                    value={tenantAddress}
                    onChange={(e) => setTenantAddress(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="collegeName" className="text-xs">
                    College Name
                  </Label>
                  <Input
                    id="collegeName"
                    placeholder="Manipal University"
                    className="mt-1"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                className="mt-1.5"
                value={dob}
                onChange={(e) => setDobValue(e.target.value)}
                required
              />
            </div>

            {!isSignup && (
              <div className="flex items-center gap-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-input border cursor-pointer"
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  Remember me
                </Label>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-success">{success}</p>}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Save Password Modal */}
      {showSavePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-display">Save Password?</h2>
              <button
                onClick={handleSkipSavePassword}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Would you like to save your phone number and date of birth? This will help you login faster next time.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={handleSkipSavePassword}
                variant="outline"
                className="flex-1"
              >
                Deny
              </Button>
              <Button
                onClick={handleSavePassword}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
