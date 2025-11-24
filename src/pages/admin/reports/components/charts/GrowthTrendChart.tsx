import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface GrowthTrendChartProps {
  data: any[];
}

export function GrowthTrendChart({ data }: GrowthTrendChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "d MMM", { locale: ar }),
    customers: item.new_customers || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number) => value.toLocaleString("ar-SA")}
        />
        <Line
          type="monotone"
          dataKey="customers"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))" }}
          name="عملاء جدد"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}