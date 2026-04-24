import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Upload } from "lucide-react";
import {
  createDocumentRecord,
  createBooking,
  getCurrentUser,
  getRooms,
  getRoomById,
  uploadVerificationFile,
} from "@/api";

const steps = ["Details", "Payment", "Documents", "Confirmation"];

function toDateInputValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toStartOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function parseValidDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return toStartOfUtcDay(parsed);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDisplayDate(value?: string | null) {
  const parsed = parseValidDate(value);
  if (!parsed) return null;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function BookingFlow() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Persistent booking data across steps
  const [bookingData, setBookingData] = useState({
    roomId: "",
    moveInDate: "",
    moveOutDate: "",
    source: "WALKIN" as "BROKER" | "WALKIN",
    brokerName: "",
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");

  // UI state for current step inputs (synced with bookingData before moving to next step)
  const [moveInDateInput, setMoveInDateInput] = useState("");
  const [moveOutDateInput, setMoveOutDateInput] = useState("");
  const [rent, setRent] = useState(0);
  const [deposit, setDeposit] = useState(2000);

  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [livePhotoFile, setLivePhotoFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Room availability data
  const [roomOccupiedUntil, setRoomOccupiedUntil] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<string>("AVAILABLE");

  const aadhaarInputRef = useRef<HTMLInputElement | null>(null);
  const collegeInputRef = useRef<HTMLInputElement | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);

  const totalDue = useMemo(() => rent + deposit, [rent, deposit]);
  const occupiedUntilDate = useMemo(
    () => parseValidDate(roomOccupiedUntil),
    [roomOccupiedUntil],
  );
  const occupiedUntilLabel = useMemo(
    () => {
      if (!roomOccupiedUntil) return null;
      return formatDisplayDate(addDays(parseValidDate(roomOccupiedUntil) ?? new Date(roomOccupiedUntil), 1).toISOString());
    },
    [roomOccupiedUntil],
  );
  const minimumMoveInDate = useMemo(() => {
    if (roomStatus === "OCCUPIED" && occupiedUntilDate) {
      return toDateInputValue(addDays(occupiedUntilDate, 1));
    }
    return toDateInputValue(new Date());
  }, [roomStatus, occupiedUntilDate]);
  const isReservedRoom = roomStatus === "RESERVED";
  const isOccupiedRoom = roomStatus === "OCCUPIED";
  const isMaintenanceRoom = roomStatus === "MAINTENANCE";

  function formatINR(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getRoomIdFromLocation() {
    const params = new URLSearchParams(location.search);
    const queryRoomId = params.get("roomId");
    const stateRoomId = (location.state as any)?.roomId;
    return String(queryRoomId || stateRoomId || "");
  }

  function extractFromFullName(fullName: string) {
    const value = String(fullName || "").trim();
    if (!value) return { first: "", last: "" };
    const [first, ...rest] = value.split(/\s+/);
    return { first, last: rest.join(" ") };
  }

  async function loadInitialData() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Please sign in to continue booking.");
      setLoading(false);
      return;
    }

    const resolvedRoomId = getRoomIdFromLocation();

    try {
      setLoading(true);
      setError("");

      const [user, room] = await Promise.all([
        getCurrentUser(token),
        resolvedRoomId ? getRoomById(resolvedRoomId) : Promise.resolve(null),
      ]);

      const fullName =
        String(user?.fullName || "").trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
      const nameParts = extractFromFullName(fullName);
      setFirstName(nameParts.first);
      setLastName(nameParts.last);
      setPhone(String(user?.phone || ""));
      setUserId(String(user?.id || ""));

      // Set booking data with roomId
      setBookingData((prev) => ({
        ...prev,
        roomId: resolvedRoomId,
      }));

      if (room) {
        const parsedRent = Number(room.rent || 0);
        const parsedDeposit = Number(room.deposit || 0);
        setRent(parsedRent);
        setDeposit(
          Number.isFinite(parsedDeposit) && parsedDeposit > 0
            ? parsedDeposit
            : 2000,
        );
        // Set room availability data
        const roomStatusValue = String(room.status || "AVAILABLE");
        setRoomStatus(roomStatusValue);
        setRoomOccupiedUntil(room.occupiedUntil ? String(room.occupiedUntil) : null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load booking details",
      );
    } finally {
      setLoading(false);
    }
  }

  // Set up roomId from URL synchronously on mount
  useEffect(() => {
    const roomIdFromUrl = getRoomIdFromLocation();
    if (roomIdFromUrl) {
      setBookingData((prev) => ({
        ...prev,
        roomId: roomIdFromUrl,
      }));
    }
  }, [location.search]);

  // Show error if no roomId is available
  const hasRoomId = !!bookingData.roomId;
  const showNoRoomError = !loading && !hasRoomId;
  
  useEffect(() => {
    loadInitialData();
    return () => {
      if (liveStreamRef.current) {
        liveStreamRef.current.getTracks().forEach((track) => track.stop());
        liveStreamRef.current = null;
      }
    };
  }, [location.key]);

  useEffect(() => {
    if (currentStep !== 2 && liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((track) => track.stop());
      liveStreamRef.current = null;
      setIsCameraOpen(false);
    }
  }, [currentStep]);

  async function startLiveCamera() {
    setError("");
    try {
      if (liveStreamRef.current) {
        liveStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      liveStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch {
      setError("Unable to access camera for live photo capture.");
      setIsCameraOpen(false);
    }
  }

  async function captureLivePhoto() {
    if (!liveVideoRef.current || !liveCanvasRef.current) return;
    const video = liveVideoRef.current;
    const canvas = liveCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const blob = await fetch(imageDataUrl).then((res) => res.blob());
    const file = new File([blob], "tenant-live-photo.jpg", {
      type: "image/jpeg",
    });
    setLivePhotoFile(file);
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((track) => track.stop());
      liveStreamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }

  function validateUploadFile(file: File | null, allowPdf = false) {
    if (!file) return "File is required.";
    const allowed = allowPdf
      ? new Set(["image/jpeg", "image/png", "application/pdf"])
      : new Set(["image/jpeg", "image/png"]);
    if (!allowed.has(file.type)) {
      return allowPdf
        ? "Only jpg, jpeg, png, pdf are allowed."
        : "Only jpg, jpeg, png are allowed.";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File size must be 5MB or less.";
    }
    return "";
  }

  async function submitBooking() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Please sign in to continue booking.");
    }
    
    // Use input state values directly - these are always up-to-date
    // Do NOT use bookingData.moveInDate/moveOutDate as state updates are async
    const currentRoomId = bookingData.roomId;
    const currentMoveInDate = moveInDateInput;
    const currentMoveOutDate = moveOutDateInput;
    
    if (!currentRoomId) {
      throw new Error(
        "Room information is missing. Please go back and select a room.",
      );
    }
    if (!currentMoveInDate || !currentMoveOutDate) {
      throw new Error("Move-in and move-out dates are required.");
    }

    // Use YYYY-MM-DD format as expected by backend
    // Map frontend source values to backend enum values
    const backendBookingSource = bookingData.source === "BROKER" ? "BROKER" : "WALK_IN";
    
    const bookingPayload = {
      roomId: currentRoomId,
      moveInDate: currentMoveInDate,
      moveOutDate: currentMoveOutDate,
      bookingSource: backendBookingSource,
      brokerName: bookingData.source === "BROKER" ? bookingData.brokerName : null,
    };

    const booking = await createBooking(token, bookingPayload);
    const bookingId = String(booking?.id || "").trim();
    if (!bookingId) {
      throw new Error("Booking created but booking id is missing");
    }

    // Refresh room data source and notify listeners after reservation is created.
    try {
      await getRooms();
    } finally {
      globalThis.dispatchEvent(new CustomEvent("rooms:updated"));
    }

    const uploads: Array<{
      file: File | null;
      documentType: string;
      name: string;
      type: "ID_CARD" | "PHOTO";
    }> = [
      {
        file: aadhaarFile,
        documentType: "AADHAAR",
        name: "AADHAAR",
        type: "ID_CARD",
      },
      {
        file: collegeIdFile,
        documentType: "COLLEGE_ID",
        name: "COLLEGE_ID",
        type: "ID_CARD",
      },
      {
        file: livePhotoFile,
        documentType: "TENANT_PHOTO",
        name: "TENANT_PHOTO",
        type: "PHOTO",
      },
    ];

    for (const item of uploads) {
      if (!item.file) continue;
      const uploaded = await uploadVerificationFile(
        token,
        item.file,
        item.documentType,
      );
      await createDocumentRecord(token, {
        bookingId,
        name: item.name,
        type: item.type,
        fileUrl: uploaded.fileUrl,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        status: "SUBMITTED",
      });
    }
  }

  async function handleContinue() {
    if (loading) return; // Don't proceed while loading
    
    if (currentStep === 0) {
      if (!bookingData.roomId) {
        setError("Room information is missing. Please go back and select a room.");
        return;
      }
      if (isReservedRoom) {
        setError("This room is currently reserved");
        return;
      }
      if (isMaintenanceRoom) {
        setError("This room is currently not available for booking.");
        return;
      }
      if (!moveInDateInput || !moveOutDateInput) {
        setError("Please select move-in and move-out dates.");
        return;
      }
      const moveInDate = parseValidDate(moveInDateInput);
      const moveOutDate = parseValidDate(moveOutDateInput);
      if (!moveInDate || !moveOutDate) {
        setError("Please select valid move-in and move-out dates.");
        return;
      }
      if (isOccupiedRoom) {
        if (!occupiedUntilDate || moveInDate <= occupiedUntilDate) {
          setError("Move-in date must be after current tenant leaves");
          return;
        }
      }
      if (moveOutDate <= moveInDate) {
        setError("Move-out date must be after move-in date");
        return;
      }
      // Validate broker name when Broker is selected
      if (bookingData.source === "BROKER" && (!bookingData.brokerName || bookingData.brokerName.trim() === "")) {
        setError("Please enter broker name");
        return;
      }
      // Save booking data before moving to next step
      setBookingData((prev) => ({
        ...prev,
        moveInDate: moveInDateInput,
        moveOutDate: moveOutDateInput,
      }));
      setError("");
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      setSubmitting(true);
      setError("");

      // Live photo is mandatory
      const liveError = validateUploadFile(livePhotoFile, false);
      if (liveError) {
        setError("Live photo is required.");
        setSubmitting(false);
        return;
      }

      // At least one identity document is required (Aadhaar OR College ID)
      const aadhaarError = validateUploadFile(aadhaarFile, true);
      const collegeError = validateUploadFile(collegeIdFile, true);
      const hasAadhaar = aadhaarFile !== null;
      const hasCollegeId = collegeIdFile !== null;
      
      if (!hasAadhaar && !hasCollegeId) {
        setError("Upload either Aadhaar card or College ID.");
        setSubmitting(false);
        return;
      }

      // If provided, validate the file
      if (hasAadhaar && aadhaarError) {
        setError(aadhaarError);
        setSubmitting(false);
        return;
      }
      if (hasCollegeId && collegeError) {
        setError(collegeError);
        setSubmitting(false);
        return;
      }

      try {
        await submitBooking();
        setCurrentStep(3);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to submit booking",
        );
      } finally {
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-10">
        <h1 className="text-2xl font-bold font-display mb-8">Book a Room</h1>
        <Stepper steps={steps} currentStep={currentStep} className="mb-10" />

        <div className="bg-card rounded-lg border p-8 shadow-card animate-fade-in">
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {currentStep === 0 && (
            <div className="space-y-4">
              {showNoRoomError && (
                <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
                  <p className="font-medium">No room selected</p>
                  <p className="text-sm mt-1">
                    Please select a room from the <Link to="/rooms" className="underline">rooms page</Link> to start booking.
                  </p>
                </div>
              )}
              {!showNoRoomError && isReservedRoom && (
                <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
                  This room is currently reserved
                </div>
              )}
              {!showNoRoomError && isOccupiedRoom && occupiedUntilLabel && (
                <div className="bg-info/10 border border-info text-info p-4 rounded-lg">
                  Available from {occupiedUntilLabel}
                </div>
              )}
              {!showNoRoomError && isMaintenanceRoom && (
                <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
                  This room is currently not available for booking.
                </div>
              )}
              <h2 className="text-lg font-semibold font-display">
                Your Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input className="mt-1.5" value={firstName} readOnly />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input className="mt-1.5" value={lastName} readOnly />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input className="mt-1.5" type="tel" value={phone} readOnly />
              </div>
              <div>
                <Label>Move-in Date</Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={moveInDateInput}
                  min={minimumMoveInDate}
                  disabled={isReservedRoom}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setMoveInDateInput(nextDate);
                    const parsedNextDate = parseValidDate(nextDate);
                    if (
                      isOccupiedRoom &&
                      occupiedUntilDate &&
                      parsedNextDate &&
                      parsedNextDate <= occupiedUntilDate
                    ) {
                      setError("Move-in date must be after current tenant leaves");
                      return;
                    }
                    if (
                      error === "Move-out date must be after move-in date" ||
                      error === "Move-in date must be after current tenant leaves"
                    ) {
                      setError("");
                    }
                  }}
                />
                {isOccupiedRoom && occupiedUntilLabel && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum move-in date is {formatDisplayDate(minimumMoveInDate)}.
                  </p>
                )}
              </div>
              <div>
                <Label>Move-out Date</Label>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={moveOutDateInput}
                  min={moveInDateInput || minimumMoveInDate}
                  disabled={isReservedRoom}
                  onChange={(e) => {
                    setMoveOutDateInput(e.target.value);
                    if (error === "Move-out date must be after move-in date") {
                      setError("");
                    }
                  }}
                />
              </div>
              <div>
                <Label>Booking Source</Label>
                <div className="mt-2 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bookingSource"
                      value="WALKIN"
                      checked={bookingData.source === "WALKIN"}
                      disabled={isReservedRoom}
                      onChange={(e) => setBookingData(prev => ({ ...prev, source: e.target.value as "BROKER" | "WALKIN", brokerName: "" }))}
                    />
                    Walk-in
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bookingSource"
                      value="BROKER"
                      checked={bookingData.source === "BROKER"}
                      disabled={isReservedRoom}
                      onChange={(e) => setBookingData(prev => ({ ...prev, source: e.target.value as "BROKER" | "WALKIN" }))}
                    />
                    Broker
                  </label>
                </div>
              </div>
              {/* Broker Name Input - Only show when Broker is selected */}
              {bookingData.source === "BROKER" && (
                <div>
                  <Label htmlFor="brokerName">Broker Name *</Label>
                  <Input
                    id="brokerName"
                    type="text"
                    placeholder="Enter broker name"
                    value={bookingData.brokerName}
                    disabled={isReservedRoom}
                    onChange={(e) => setBookingData(prev => ({ ...prev, brokerName: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-display">
                Payment Summary
              </h2>
              <div className="space-y-3 rounded-lg bg-muted p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Rent</span>
                  <span className="font-medium">{formatINR(rent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Security Deposit
                  </span>
                  <span className="font-medium">{formatINR(deposit)}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Due Now</span>
                  <span className="text-primary">{formatINR(totalDue)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Payment will be processed after document verification.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-display">
                Upload Documents
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload your live photo and at least one ID proof (Aadhaar or College ID).
              </p>

              {[
                {
                  key: "aadhaar",
                  title: "Aadhaar Card (optional)",
                  hint: "Upload your Aadhaar card (jpg, jpeg, png, pdf up to 5MB)",
                  onClick: () => aadhaarInputRef.current?.click(),
                  fileName: aadhaarFile?.name || "",
                },
                {
                  key: "college",
                  title: "College ID (optional)",
                  hint: "Upload your College ID (jpg, jpeg, png, pdf up to 5MB)",
                  onClick: () => collegeInputRef.current?.click(),
                  fileName: collegeIdFile?.name || "",
                },
                {
                  key: "live",
                  title: "Live Photo * (required)",
                  hint: "Capture using device camera - this is required",
                  onClick: async () => {
                    if (!liveStreamRef.current) {
                      await startLiveCamera();
                    } else {
                      await captureLivePhoto();
                    }
                  },
                  fileName: livePhotoFile?.name || "",
                },
              ].map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between rounded-lg border border-dashed p-4 hover:border-primary hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.hint}
                      </p>
                      {doc.fileName && (
                        <p className="text-xs text-primary mt-1">
                          {doc.fileName}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={doc.onClick}>
                    {doc.key === "live"
                      ? isCameraOpen
                        ? "Capture"
                        : "Open Camera"
                      : "Upload"}
                  </Button>
                </div>
              ))}

              <input
                ref={aadhaarInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
              />
              <input
                ref={collegeInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={(e) => setCollegeIdFile(e.target.files?.[0] || null)}
              />

              <div className={isCameraOpen ? "" : "hidden"}>
                <video
                  ref={liveVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", borderRadius: "8px" }}
                />
                <canvas ref={liveCanvasRef} />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold font-display">
                Booking Submitted!
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your booking request has been submitted. Waiting for admin approval. 
                Once approved, you'll be notified to complete your payment.
              </p>
              <Button asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          )}

          {currentStep < 3 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                onClick={handleContinue}
                disabled={
                  loading ||
                  submitting ||
                  (currentStep === 0 &&
                    (!moveInDateInput ||
                      !moveOutDateInput ||
                      isReservedRoom ||
                      isMaintenanceRoom))
                }
              >
                {currentStep === 2 ? "Submit" : "Continue"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
