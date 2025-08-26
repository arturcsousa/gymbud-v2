import UspTicker from './components/UspTicker';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Hero from './sections/Hero';
import HowItWorks from './sections/HowItWorks';
import WhyDifferent from './sections/WhyDifferent';
import Programs from './sections/Programs';
import Progress from './sections/Progress';
import Pricing from './sections/Pricing';
import Faq from './sections/Faq';
import FinalCta from './sections/FinalCta';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-[#0b0b0f] dark:to-[#0a0a0d]">
      <UspTicker />
      <NavBar />
      <main>
        <Hero />
        <HowItWorks />
        <WhyDifferent />
        <Programs />
        <Progress />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      {/* Sticky mobile CTA */}
      <a
        href={(import.meta as any).env?.NEXT_PUBLIC_SITE_URL || (import.meta as any).env?.VITE_SITE_URL || 'https://app.gymbud.ai'}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 md:hidden rounded-full bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg"
      >
        Start Free
      </a>
    </div>
  );
}
