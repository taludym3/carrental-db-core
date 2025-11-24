import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface PaymentMethodsChartProps {
  data: any[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "#8b5cf6",
  "#f97316",
];

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.method || "غير محدد",
    value: item.amount || 0,
    count: item.count || 0,
  }));

  const renderLabel = (entry: any) => {
    return `${entry.name}: ${entry.percentage?.toFixed(1)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number) => value.toLocaleString("ar-SA") + " ر.س"}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}