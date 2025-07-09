import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  bgColor?: string;
}

export default function StatsCard({ title, value, icon, trend, bgColor = "bg-blue-100" }: StatsCardProps) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-corporate-secondary">{value}</p>
          </div>
          <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            {trend.direction === "up" ? (
              <ArrowUp className="h-4 w-4 text-corporate-accent mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 text-corporate-accent mr-1" />
            )}
            <span className="text-corporate-accent">{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
