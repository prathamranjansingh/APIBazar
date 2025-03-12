import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton";

const RateLimitChart = ({ apiId, className }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (apiId) {
      fetchAnalyticsData();
    }
  }, [apiId]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics/${apiId}?period=30days`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      const data = await response.json();
      // Transform data for chart
      const formattedData = data.dailyUsage.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        requests: item.requests,
        errors: item.errors || 0,
        successRate: ((item.requests - (item.errors || 0)) / item.requests) * 100 || 0
      }));
      setAnalyticsData(formattedData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        title: "Failed to load analytics",
        description: "Could not retrieve usage data at this time.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Skeleton className={`w-full ${className || 'h-80'}`} />;
  }

  if (!analyticsData || analyticsData.length === 0) {
    return (
      <div className={`flex items-center justify-center border rounded-lg ${className || 'h-80'}`}>
        <div className="text-center p-6">
          <p className="text-muted-foreground">No usage data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={analyticsData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="requests"
            name="Requests"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.2}
            activeDot={{ r: 8 }}
          />
          <Area
            type="monotone"
            dataKey="errors"
            name="Errors"
            stroke="#EF4444"
            fill="#EF4444"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RateLimitChart;