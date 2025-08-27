import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface VolumeSetsComboProps {
  data: Array<{
    day: string;
    sessions: number;
    volume: number;
    sets: number;
  }>;
}

export function VolumeSetsCombo({ data }: VolumeSetsComboProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis 
          dataKey="day" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <YAxis 
          yAxisId="left"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <Bar 
          yAxisId="left"
          dataKey="volume" 
          fill="#0d9488"
          opacity={0.6}
          radius={[2, 2, 0, 0]}
        />
        <Line 
          yAxisId="right"
          type="monotone"
          dataKey="sets"
          stroke="#14b8a6"
          strokeWidth={2}
          dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
