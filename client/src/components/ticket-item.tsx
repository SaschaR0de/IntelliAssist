import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TriangleAlert, CircleHelp, CheckCircle } from "lucide-react";

interface TicketItemProps {
  ticket: {
    id: number;
    title: string;
    priority: "low" | "medium" | "high";
    createdAt: Date;
    status: string;
  };
  onClick?: () => void;
}

const priorityConfig = {
  high: { color: "bg-red-100 text-red-800", icon: TriangleAlert },
  medium: { color: "bg-yellow-100 text-yellow-800", icon: CircleHelp },
  low: { color: "bg-green-100 text-green-800", icon: CheckCircle },
};

export default function TicketItem({ ticket, onClick }: TicketItemProps) {
  const config = priorityConfig[ticket.priority];
  const IconComponent = config.icon;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 ${config.color.split(' ')[0]} rounded-full flex items-center justify-center`}>
            <IconComponent className={`h-5 w-5 ${config.color.split(' ')[1]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-corporate-secondary truncate">{ticket.title}</p>
            <p className="text-xs text-gray-500">{formatTime(ticket.createdAt)}</p>
          </div>
          <Badge className={config.color} variant="secondary">
            {ticket.priority}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
