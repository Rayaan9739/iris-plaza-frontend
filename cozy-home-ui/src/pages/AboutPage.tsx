import React from "react";
import {
  HeroSection,
  SectionHeader,
  InfoCard,
  Timeline,
  StatsGrid,
  CTASection,
} from "@/components/marketing";

const timelineData = [
  {
    year: "2022",
    title: "The Beginning",
    description:
      "Founded with a vision to transform rental management in Manipal, starting with just 10 properties.",
  },
  {
    year: "2023",
    title: "Going Digital",
    description:
      "Launched our full-stack platform with online bookings, digital document verification, and automated rent collection.",
  },
  {
    year: "2024",
    title: "Scaling Up",
    description:
      "Expanded to 500+ properties across Manipal and Udupi, with a team of 25 dedicated professionals.",
  },
  {
    year: "2025",
    title: "Industry Leader",
    description:
      "Became the most trusted rental platform in the region with 2000+ happy tenants and 98% satisfaction rate.",
  },
];

const statsData = [
  { value: "2000", suffix: "+", label: "Properties Managed" },
  { value: "2500", suffix: "+", label: "Happy Tenants" },
  { value: "5", suffix: "+", label: "Years Experience" },
  { value: "98", suffix: "%", label: "Satisfaction Rate" },
];

const valuesData = [
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Transparency",
    description:
      "We believe in complete honesty. Every fee, every policy, every process is clearly communicated with no hidden surprises.",
  },
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    title: "Tenant Safety",
    description:
      "Your safety is our priority. All properties are verified, and we maintain strict security standards for all our tenants.",
  },
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
    title: "Smart Automation",
    description:
      "From rent payments to maintenance requests, everything is automated for your convenience. Manage everything from your phone.",
  },
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    title: "Reliable Living",
    description:
      "We maintain every property to the highest standards. 24/7 support team ensures your living experience is always comfortable.",
  },
];

const howItWorksData = [
  {
    step: 1,
    title: "Browse Rooms",
    description:
      "Explore our curated collection of verified properties with detailed photos, amenities, and pricing.",
  },
  {
    step: 2,
    title: "Book Securely",
    description:
      "Select your preferred room and complete your booking with our secure payment system.",
  },
  {
    step: 3,
    title: "Verify Documents",
    description:
      "Upload your ID and income proofs for quick verification. Our team processes applications within 24 hours.",
  },
  {
    step: 4,
    title: "Move In",
    description:
      "Receive your confirmation, get your keys, and move into your new home with complete peace of mind.",
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <HeroSection
        title="Revolutionizing Rental Living in Manipal"
        subtitle="We're on a mission to make finding and managing rental properties as simple and stress-free as possible."
        ctaText="View Our Listings"
        ctaLink="/listings"
        secondaryCtaText="Get in Touch"
        secondaryCtaLink="/contact"
      />

      {/* Company Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <SectionHeader
                title="Our Story"
                subtitle="From manual paperwork to seamless digital experiences"
                alignment="left"
              />
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Manipal Rooms started with a simple observation: finding a
                  good rental property in Manipal was unnecessarily complicated.
                  Students and working professionals spent weeks navigating
                  through paperwork, physical visits, and unclear processes.
                </p>
                <p>
                  We saw an opportunity to transform this experience. By
                  combining technology with local expertise, we created a
                  platform that handles everything from property discovery to
                  move-in — all in one place.
                </p>
                <p>
                  Today, we're proud to be the trusted choice for thousands of
                  tenants and property owners across Manipal and Udupi.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">5+</div>
                    <div className="text-emerald-100">Years of Service</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">2000+</div>
                    <div className="text-emerald-100">Properties</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">98%</div>
                    <div className="text-emerald-100">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">24h</div>
                    <div className="text-emerald-100">Verification</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeader
            title="Our Journey"
            subtitle="From a small startup to Manipal's leading rental platform"
          />
          <Timeline items={timelineData} />
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader
            title="Our Values"
            subtitle="What drives us every day to deliver the best rental experience"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valuesData.map((value, index) => (
              <InfoCard
                key={index}
                icon={value.icon}
                title={value.title}
                description={value.description}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader
            title="How It Works"
            subtitle="Getting your dream rental is just four simple steps"
          />
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorksData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          <StatsGrid stats={statsData} />
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        title="Ready to Find Your Perfect Home?"
        description="Browse our listings and find the perfect rental property for you."
        primaryCTA={{ text: "View Listings", link: "/" }}
        secondaryCTA={{ text: "Contact Us", link: "/contact" }}
      />

      {/* Footer placeholder - would use existing Navbar/Footer */}
    </div>
  );
}
