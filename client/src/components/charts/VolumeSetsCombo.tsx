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
          tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
        />
        <YAxis 
          yAxisId="left"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
        />
        <Bar 
          yAxisId="left"
          dataKey="volume" 
          fill="#00BFA6"
          opacity={0.8}
          radius={[2, 2, 0, 0]}
        />
        <Line 
          yAxisId="right"
          type="monotone"
          dataKey="sets"
          stroke="#64FFDA"
          strokeWidth={3}
          dot={{ fill: '#64FFDA', strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
