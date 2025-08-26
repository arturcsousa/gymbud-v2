import { Route } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Landing from '@/marketing/Landing';
import { AppShell } from '@/app/AppShell';
import OfflineBanner from '@/app/components/OfflineBanner';

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
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <AppShell>
        <Route path="/" component={Landing} />
        {/* Optional stubs for future long-form pages if we keep them: */}
        <Route path="/how-it-works">{() => <Landing />}</Route>
        <Route path="/programs">{() => <Landing />}</Route>
        <Route path="/pricing">{() => <Landing />}</Route>
        <Route path="/faq">{() => <Landing />}</Route>
      </AppShell>
    </QueryClientProvider>
  );
}

export default App;
