import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Landing from '@/marketing/Landing';
import { AppShell } from '@/app/AppShell';
import { OfflineBanner } from '@/app/components/OfflineBanner';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  // Debug logging
  console.log('App.tsx - Domain Check:', {
    hostname: window.location.hostname,
    href: window.location.href,
    isApp: window.location.hostname === 'app.gymbud.ai',
    isLocalhost: window.location.hostname === 'localhost',
    isVercel: window.location.hostname.includes('vercel.app')
  });

  // Check if we're on the app subdomain - FIXED: Check for exact Vercel preview URL
  const isAppDomain = window.location.hostname === 'app.gymbud.ai' || 
                     window.location.hostname === 'localhost' ||
                     window.location.hostname.startsWith('gymbud-v2-') ||
                     window.location.hostname.includes('-arturcsousa.vercel.app');

  console.log('App.tsx - Rendering:', isAppDomain ? 'AppShell' : 'Landing');

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      {isAppDomain ? (
        // Render app routes for app.gymbud.ai
        <AppShell />
      ) : (
        // Render landing page for gymbud.ai
        <Landing />
      )}
    </QueryClientProvider>
  );
}

export default App;
