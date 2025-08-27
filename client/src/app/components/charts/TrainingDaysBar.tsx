import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface TrainingDaysBarProps {
  data: { week: string; days: number }[];
}

export function TrainingDaysBar({ data }: TrainingDaysBarProps) {
  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="week" hide />
          <YAxis hide domain={[0, 7]} />
          <Tooltip 
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white'
            }}
          />
          <Bar 
            dataKey="days" 
            radius={[8, 8, 0, 0]} 
            fill="url(#trainingGradient)"
          />
          <defs>
            <linearGradient id="trainingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00BFA6" />
              <stop offset="100%" stopColor="#64FFDA" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
