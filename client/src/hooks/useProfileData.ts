import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface WeightEntry {
  date: string;
  weight: number;
}

interface ProfileData {
  currentWeight: number;
  weightHistory: WeightEntry[];
}

export function useProfileData() {
  const [offlineData, setOfflineData] = useState<ProfileData | null>(null);

  // Query offline data from localStorage (basic fallback)
  useEffect(() => {
    const loadOfflineData = () => {
      try {
        const savedProfile = localStorage.getItem('gymbud_profile_data');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setOfflineData(parsed);
        }
      } catch (error) {
        console.error('Failed to load offline profile data:', error);
      }
    };

    loadOfflineData();
  }, []);

  // Query online data from Supabase profiles table
  const { data: onlineData, isLoading, error } = useQuery({
    queryKey: ['profile-data'],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Query profile data with weight history
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('weight_kg, updated_at')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Query weight history from a hypothetical weight_logs table
      // If this doesn't exist, we'll use the current weight as a single point
      const { data: weightLogs, error: weightError } = await supabase
        .from('weight_logs')
        .select('logged_at, weight_kg')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true })
        .limit(50);

      // If weight_logs table doesn't exist, create history from current weight
      let weightHistory: WeightEntry[] = [];
      
      if (weightError && weightError.code === '42P01') {
        // Table doesn't exist, use current weight as single data point
        if (profile?.weight_kg) {
          weightHistory = [{
            date: profile.updated_at || new Date().toISOString(),
            weight: profile.weight_kg
          }];
        }
      } else if (weightLogs && weightLogs.length > 0) {
        // Transform weight logs to our format
        weightHistory = weightLogs.map(log => ({
          date: log.logged_at,
          weight: log.weight_kg
        }));
      } else if (profile?.weight_kg) {
        // No weight logs but have current weight
        weightHistory = [{
          date: profile.updated_at || new Date().toISOString(),
          weight: profile.weight_kg
        }];
      }

      const profileData = {
        currentWeight: profile?.weight_kg || 0,
        weightHistory
      };

      // Cache to localStorage for offline access
      localStorage.setItem('gymbud_profile_data', JSON.stringify(profileData));

      return profileData;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });

  // Return online data if available, otherwise offline data
  const profileData = useMemo(() => {
    return onlineData || offlineData || {
      currentWeight: 0,
      weightHistory: []
    };
  }, [onlineData, offlineData]);

  return {
    profileData,
    isLoading: isLoading && !offlineData,
    error,
    isOffline: !onlineData && !!offlineData,
  };
}
