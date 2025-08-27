import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-xl ring-1 ring-white/20 rounded-2xl shadow-2xl">
      <CardHeader className="py-3">
        <CardTitle className="text-white/90 text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
