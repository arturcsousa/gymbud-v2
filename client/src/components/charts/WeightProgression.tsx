import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface WeightProgressionProps {
  data: Array<{
    date: string;
    weight: number;
  }>;
}

export function WeightProgression({ data }: WeightProgressionProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
          domain={['dataMin - 1', 'dataMax + 1']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff'
          }}
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value: number) => [`${value} kg`, 'Weight']}
        />
        <Line 
          type="monotone"
          dataKey="weight"
          stroke="#64FFDA"
          strokeWidth={4}
          dot={{ fill: '#64FFDA', strokeWidth: 2, r: 6 }}
          activeDot={{ r: 8, fill: '#00BFA6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
