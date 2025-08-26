import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages (placeholders for now)
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import ProgramsPage from './pages/ProgramsPage';
import PricingPage from './pages/PricingPage';
import FAQPage from './pages/FAQPage';
import NotFoundPage from './pages/NotFoundPage';

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
      <Router>
        <Switch>
          {/* Marketing site routes */}
          <Route path="/" component={HomePage} />
          <Route path="/how-it-works" component={HowItWorksPage} />
          <Route path="/programs" component={ProgramsPage} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/faq" component={FAQPage} />
          
          {/* App routes (placeholder - will link to app.gymbud.ai in production) */}
          <Route path="/app/:rest*">
            {() => (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">App Coming Soon</h1>
                  <p className="text-gray-600">
                    The GymBud app will be available at app.gymbud.ai
                  </p>
                </div>
              </div>
            )}
          </Route>
          
          {/* 404 fallback */}
          <Route component={NotFoundPage} />
        </Switch>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
