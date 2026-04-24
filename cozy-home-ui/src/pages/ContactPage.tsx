import React from "react";
import {
  HeroSection,
  SectionHeader,
  ContactForm,
  ContactInfoCard,
  MapEmbed,
  FAQAccordion,
} from "@/components/marketing";

const contactInfoData = [
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
    title: "Phone",
    details: ["+91 98765 43210", "+91 820 256 7890"],
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    title: "Email",
    details: ["hello@manipalrooms.com", "support@manipalrooms.com"],
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    title: "Office",
    details: [
      "Opp: to Mandovi Plaza End Point Road",
      "Manipal",
      "Manipal, Udupi - 576104",
    ],
  },
];

const businessHours = [
  { day: "Monday - Sunday", time: "9:00 AM - 8:00 PM" },
];

const faqData = [
  {
    question: "What are your working hours?",
    answer:
      "Our office is open Monday to Friday from 9:00 AM to 7:00 PM. On Saturdays, we're available from 10:00 AM to 5:00 PM. Sundays are by appointment only for urgent matters.",
  },
  {
    question: "How quickly can I get a response?",
    answer:
      "We typically respond to all inquiries within 24 hours during business days. For urgent matters, please call us directly.",
  },
  {
    question: "Do you offer property viewings?",
    answer:
      "Yes! We offer virtual and in-person property viewings. You can schedule a viewing through our website or by calling our office.",
  },
  {
    question: "What documents do I need to rent?",
    answer:
      "You'll need a valid ID proof (Aadhar/PAN/Voter ID), address proof, and income verification. Our team will guide you through the entire verification process.",
  },
];

export function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <HeroSection
        title="Get in Touch"
        subtitle="We're here to help you find your perfect rental home. Reach out to us anytime."
        ctaText="View Listings"
        ctaLink="/"
      />

      {/* Contact Options Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <SectionHeader
                title="Send Us a Message"
                subtitle="Fill out the form below and we'll get back to you shortly"
                alignment="left"
              />
              <ContactForm />
            </div>

            {/* Contact Info */}
            <div>
              <SectionHeader
                title="Contact Information"
                subtitle="Reach out to us through any of these channels"
                alignment="left"
              />
              <div className="space-y-4 mb-8">
                {contactInfoData.map((info, index) => (
                  <ContactInfoCard key={index} info={info} />
                ))}
              </div>

              {/* Business Hours */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Business Hours
                </h3>
                <div className="space-y-3">
                  {businessHours.map((hours, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-slate-600">{hours.day}</span>
                      <span className="font-medium text-slate-900">
                        {hours.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader
            title="Find Our Office"
            subtitle="Visit us at our office in Manipal"
          />
          <MapEmbed address="Opp. to Mandovi Plaza End Point Road, Manipal, Udupi - 576104" />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Quick answers to common questions"
          />
          <FAQAccordion items={faqData} />
        </div>
      </section>
    </div>
  );
}
