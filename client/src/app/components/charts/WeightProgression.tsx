import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface WeightProgressionProps {
  data: { date: string; kg: number }[];
}

export function WeightProgression({ data }: WeightProgressionProps) {
  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip 
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="kg" 
            strokeWidth={2} 
            dot={false} 
            stroke="url(#weightGradient)"
          />
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00BFA6" />
              <stop offset="100%" stopColor="#64FFDA" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
