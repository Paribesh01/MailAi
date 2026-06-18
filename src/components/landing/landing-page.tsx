import { Navbar } from "./navbar"
import { Hero } from "./hero"
import { Stats } from "./stats"
import { Features } from "./features"
import { HowItWorks } from "./how-it-works"
import { Testimonials } from "./testimonials"
import { Pricing } from "./pricing"
import { CTA } from "./cta"
import { Footer } from "./footer"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}
