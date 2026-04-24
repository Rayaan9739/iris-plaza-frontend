import React from "react";
import {
  Wifi,
  Tv,
  Wind,
  ChefHat,
  Waves,
  Refrigerator,
  Car,
  Utensils,
  ShieldCheck,
  Bell,
  Clock,
  UserCheck,
  Home,
  CheckCircle2,
  Lock,
  Bath,
  Trash2,
  Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AmenitiesListProps {
  amenities: any;
  variant?: "card" | "full";
  className?: string;
}

// Map amenity names to icons
const AMENITY_MAP: Record<string, { icon: React.ReactNode; label: string }> = {
  // AC / Cooling
  ac: { icon: <Wind className="h-4 w-4" />, label: "AC" },
  "air conditioning": { icon: <Wind className="h-4 w-4" />, label: "AC" },

  // Electronics
  tv: { icon: <Tv className="h-4 w-4" />, label: "TV" },
  television: { icon: <Tv className="h-4 w-4" />, label: "TV" },
  "free wifi": { icon: <Wifi className="h-4 w-4" />, label: "Free Wifi" },
  wifi: { icon: <Wifi className="h-4 w-4" />, label: "Wifi" },
  "power backup": {
    icon: <Waves className="h-4 w-4" />,
    label: "Power backup",
  },

  // Appliances
  refrigerator: {
    icon: <Refrigerator className="h-4 w-4" />,
    label: "Refrigerator",
  },
  fridge: { icon: <Refrigerator className="h-4 w-4" />, label: "Fridge" },
  "washing machine": {
    icon: <Waves className="h-4 w-4" />,
    label: "Washing machine",
  },
  "water purifier": {
    icon: <Waves className="h-4 w-4" />,
    label: "Water purifier",
  },
  RO: { icon: <Waves className="h-4 w-4" />, label: "Water purifier" },
  "kitchen cabinate": {
    icon: <ChefHat className="h-4 w-4" />,
    label: "Kitchen cabinets",
  },
  kitchen: { icon: <ChefHat className="h-4 w-4" />, label: "Kitchen" },

  // Security / Services
  "cctv cameras": {
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "CCTV cameras",
  },
  cctv: { icon: <ShieldCheck className="h-4 w-4" />, label: "CCTV" },
  reception: { icon: <UserCheck className="h-4 w-4" />, label: "Reception" },
  "24/7 check-in": {
    icon: <Clock className="h-4 w-4" />,
    label: "24/7 check-in",
  },
  "late check-in": {
    icon: <Clock className="h-4 w-4" />,
    label: "Late check-in",
  },
  "daily housekeeping": {
    icon: <Trash className="h-4 w-4" />,
    label: "Daily housekeeping",
  },
  housekeeping: { icon: <Trash2 className="h-4 w-4" />, label: "Housekeeping" },
  "fire extinguisher": {
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Fire extinguisher",
  },
  "buzzer/door bell": {
    icon: <Bell className="h-4 w-4" />,
    label: "Buzzer/door bell",
  },

  // Facilities
  elevator: { icon: <Home className="h-4 w-4" />, label: "Elevator" },
  lift: { icon: <Home className="h-4 w-4" />, label: "Elevator" },
  parking: { icon: <Car className="h-4 w-4" />, label: "Parking" },
  "attached bathroom": {
    icon: <Bath className="h-4 w-4" />,
    label: "Attached bathroom",
  },

  // Furniture
  sofa: { icon: <Utensils className="h-4 w-4" />, label: "Sofa" },
  wardrobe: { icon: <Lock className="h-4 w-4" />, label: "Wardrobe" },
  "2 single bed": { icon: <Home className="h-4 w-4" />, label: "2 Single Bed" },
  "single bed": { icon: <Home className="h-4 w-4" />, label: "Single Bed" },
  "double bed": { icon: <Home className="h-4 w-4" />, label: "Double Bed" },
};

const getAmenityConfig = (name: string) => {
  const lowerName = name.toLowerCase().trim();

  // Direct match
  if (AMENITY_MAP[lowerName]) return AMENITY_MAP[lowerName];

  // Partial matches
  if (lowerName.includes("wifi")) return AMENITY_MAP["wifi"];
  if (lowerName.includes("ac") || lowerName.includes("air cond"))
    return AMENITY_MAP["ac"];
  if (lowerName.includes("tv")) return AMENITY_MAP["tv"];
  if (lowerName.includes("backup")) return AMENITY_MAP["power backup"];
  if (lowerName.includes("cctv")) return AMENITY_MAP["cctv"];
  if (lowerName.includes("check-in")) return AMENITY_MAP["24/7 check-in"];
  if (lowerName.includes("fridge")) return AMENITY_MAP["fridge"];

  // Default fallback - show original name with default icon
  return { icon: <CheckCircle2 className="h-4 w-4" />, label: name };
};

export const AmenitiesList: React.FC<AmenitiesListProps> = ({
  amenities,
  variant = "card",
  className,
}) => {
  const parsedAmenities = React.useMemo(() => {
    let result: string[] = [];

    const extractNames = (data: any) => {
      if (!data) return;

      if (typeof data === "string") {
        // Try to parse JSON string if it looks like one
        if (data.trim().startsWith("[") || data.trim().startsWith("{")) {
          try {
            extractNames(JSON.parse(data));
          } catch {
            result.push(data);
          }
        } else {
          result.push(data);
        }
        return;
      }

      if (Array.isArray(data)) {
        data.forEach((item) => extractNames(item));
        return;
      }

      if (typeof data === "object") {
        // Handle common structures like { amenity: { name: '...' } } or { name: '...' }
        if (data.name) extractNames(data.name);
        else if (data.amenity?.name) extractNames(data.amenity.name);
        else if (data.label) extractNames(data.label);
      }
    };

    extractNames(amenities);

    // Filter out duplicates and empty strings
    return [...new Set(result)].filter(Boolean);
  }, [amenities]);

  if (parsedAmenities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No amenities listed.</p>
    );
  }

  if (variant === "card") {
    // Show top 4 icons in a row or grid
    return (
      <div className={cn("grid grid-cols-2 gap-x-2 gap-y-1 mt-2", className)}>
        {parsedAmenities.slice(0, 4).map((name, index) => {
          const config = getAmenityConfig(name);
          return (
            <div
              key={index}
              className="flex items-start gap-1.5 text-[11px] text-muted-foreground min-w-0"
            >
              <span className="text-primary flex-shrink-0">{config.icon}</span>
              <span className="leading-tight break-words">{config.label}</span>
            </div>
          );
        })}
        {parsedAmenities.length > 4 && (
          <div className="text-[10px] text-muted-foreground font-medium pl-5">
            +{parsedAmenities.length - 4} more
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6",
        className,
      )}
    >
      {parsedAmenities.map((name, index) => {
        const config = getAmenityConfig(name);
        return (
          <div key={index} className="flex items-center gap-3">
            <div className="flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {React.cloneElement(config.icon as React.ReactElement, {
                className: "h-5 w-5",
              })}
            </div>
            <span className="text-sm md:text-base font-medium text-foreground">
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
