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
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
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
          stroke="#14b8a6"
          strokeWidth={3}
          dot={{ fill: '#14b8a6', strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7, fill: '#0d9488' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
