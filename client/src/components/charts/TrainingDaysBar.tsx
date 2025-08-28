import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface TrainingDaysBarProps {
  data: Array<{
    day: string;
    sessions: number;
    volume: number;
    sets: number;
  }>;
}

export function TrainingDaysBar({ data }: TrainingDaysBarProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis 
          dataKey="day" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
        />
        <Bar 
          dataKey="sessions" 
          fill="#00BFA6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
