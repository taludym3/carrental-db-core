import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BranchComparisonChartProps {
  data: any[];
}

export function BranchComparisonChart({ data }: BranchComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  const chartData = data
    .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
    .slice(0, 10)
    .map((branch) => ({
      name: branch.branch_name_ar,
      revenue: branch.total_revenue || 0,
      bookings: branch.total_bookings || 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs" />
        <YAxis dataKey="name" type="category" width={150} className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number, name: string) => {
            if (name === "revenue") return value.toLocaleString("ar-SA") + " ر.س";
            return value.toLocaleString("ar-SA");
          }}
          labelFormatter={(label) => `الفرع: ${label}`}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" name="الإيرادات" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}