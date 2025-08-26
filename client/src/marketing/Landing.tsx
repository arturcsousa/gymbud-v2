import { useEffect } from 'react';
import { useLocation } from 'wouter';
import UspTicker from './components/UspTicker';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import MobileCTA from './components/MobileCTA';
import Hero from './sections/Hero';
import HowItWorks from './sections/HowItWorks';
import WhyDifferent from './sections/WhyDifferent';
import Programs from './sections/Programs';
import Progress from './sections/Progress';
import Pricing from './sections/Pricing';
import Faq from './sections/Faq';
import FinalCta from './sections/FinalCta';

const PATH_TO_ANCHOR: Record<string, string> = {
  '/how-it-works': 'how',
  '/programs': 'programs',
  '/pricing': 'pricing',
  '/faq': 'faq',
};

export default function Landing() {
  const [location] = useLocation();

  useEffect(() => {
    const id = PATH_TO_ANCHOR[location];
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location]);

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
      <MobileCTA />
      <Footer />
    </div>
  );
}
