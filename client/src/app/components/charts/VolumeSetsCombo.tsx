import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface VolumeSetsComboProps {
  data: { wk: string; sets: number; volume: number }[];
}

export function VolumeSetsCombo({ data }: VolumeSetsComboProps) {
  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="wk" hide />
          <YAxis hide />
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
            dataKey="sets" 
            barSize={10} 
            radius={[6, 6, 0, 0]} 
            fill="url(#setsGradient)"
          />
          <Line 
            type="monotone" 
            dataKey="volume" 
            dot={false} 
            strokeWidth={2} 
            stroke="#64FFDA"
          />
          <defs>
            <linearGradient id="setsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00BFA6" />
              <stop offset="100%" stopColor="#0C8F93" />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
