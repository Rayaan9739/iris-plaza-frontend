import React from "react";

interface MapEmbedProps {
  address?: string;
}

export function MapEmbed({ address }: MapEmbedProps) {
  // Encode the address for Google Maps embed
  const encodedAddress = encodeURIComponent(
    address || "Opp. to Mandovi Plaza End Point Road, Manipal, Udupi - 576104"
  );

  return (
    <div className="bg-slate-200 rounded-2xl overflow-hidden h-80 md:h-96 relative">
      <iframe
        title="Office Location"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.563856327628!2d74.79028867326536!3d13.02365768735217!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba4a1e79e6e1c1%3A0x4c5e4f5a6c7d8e9f!2sMandovi%20Plaza%2C%20Manipal!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin`}
      />
      {address && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-white font-medium text-sm">{address}</p>
        </div>
      )}
    </div>
  );
}
