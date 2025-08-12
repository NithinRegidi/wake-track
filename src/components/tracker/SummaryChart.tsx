import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface SummaryChartProps {
  productive: number;
  unproductive: number;
  neutral: number;
}

const COLORS = [
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

export const SummaryChart = ({ productive, unproductive, neutral }: SummaryChartProps) => {
  const data = [
    { name: "Productive", value: productive },
    { name: "Unproductive", value: unproductive },
    { name: "Uncategorized", value: neutral },
  ];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--background))" strokeWidth={4} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SummaryChart;
