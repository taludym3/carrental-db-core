import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface HeatMapChartProps {
  data: any[];
}

export function HeatMapChart({ data }: HeatMapChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate heat map data
  const heatMapData = days.flatMap((day, dayIndex) =>
    hours.map((hour) => ({
      day: dayIndex,
      hour,
      value: Math.floor(Math.random() * 100), // Replace with actual data
    }))
  );

  const getColor = (value: number) => {
    if (value > 75) return "hsl(var(--primary))";
    if (value > 50) return "hsl(var(--secondary))";
    if (value > 25) return "hsl(var(--accent))";
    return "hsl(var(--muted))";
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis type="number" dataKey="hour" name="الساعة" domain={[0, 23]} />
        <YAxis
          type="number"
          dataKey="day"
          name="اليوم"
          domain={[0, 6]}
          tickFormatter={(value) => days[value]}
        />
        <ZAxis type="number" dataKey="value" range={[50, 500]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: any, name: string, props: any) => {
            if (name === "hour") return `${value}:00`;
            if (name === "day") return days[value];
            return value;
          }}
        />
        <Scatter data={heatMapData} fill="hsl(var(--primary))">
          {heatMapData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}