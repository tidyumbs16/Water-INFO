import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from "../../lib/utils"

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  trend: number;
  className?: string;
}

const StatCard = ({ title, value, unit, icon, trend, className }: StatCardProps) => {
  const isPositive = trend > 0;

  return (
    <Card className="glass-effect shadow-xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <CardContent className="p-0">
        <div className={cn("h-2 bg-gradient-to-r", className)} />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{value}</span>
                <span className="text-sm text-gray-500">{unit}</span>
              </div>
            </div>
            <div className={cn(
              "p-3 rounded-full bg-gradient-to-r shadow-lg",
              className
            )}>
              <div className="text-white">
                {icon}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              isPositive 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            )}>
              {isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </div>
            <span className="text-xs text-gray-500">เทียบกับเดือนที่แล้ว</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
