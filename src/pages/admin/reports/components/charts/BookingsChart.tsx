import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface BookingsChartProps {
  data: any[];
}

export function BookingsChart({ data }: BookingsChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "d MMM", { locale: ar }),
    bookings: item.bookings || 0,
    revenue: item.revenue || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
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
        <Legend />
        <Bar dataKey="bookings" fill="hsl(var(--primary))" name="عدد الحجوزات" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}