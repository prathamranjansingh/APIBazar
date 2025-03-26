import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

const PerformanceSection = ({ data, avgResponseTime }) => {
  // No data state
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            No performance data available for this API
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format data for chart
  const chartData = [
    { name: 'p50', value: data.p50, description: '50% of requests' },
    { name: 'p90', value: data.p90, description: '90% of requests' },
    { name: 'p95', value: data.p95, description: '95% of requests' },
    { name: 'p99', value: data.p99, description: '99% of requests' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Response Time Percentiles</CardTitle>
          <CardDescription>
            Response time distribution across different percentiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 14 }}
                  tickFormatter={(value) => value.toUpperCase()}
                />
                <YAxis
                  label={{
                    value: 'Response Time (ms)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 }
                  }}
                />
                <Tooltip
                  formatter={(value) => `${value.toFixed(2)}ms`}
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.name === label);
                    return `${label.toUpperCase()} (${item?.description})`;
                  }}
                />
                <ReferenceLine
                  y={avgResponseTime}
                  label={{
                    value: `Avg: ${avgResponseTime.toFixed(2)}ms`,
                    position: 'right',
                    fill: '#EF4444',
                    fontSize: 12
                  }}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                />
                <Bar
                  dataKey="value"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                  name="Response Time"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">p50 Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.p50.toFixed(2)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              50% of requests are faster than this
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">p90 Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.p90.toFixed(2)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              90% of requests are faster than this
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">p95 Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.p95.toFixed(2)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              95% of requests are faster than this
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">p99 Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.p99.toFixed(2)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              99% of requests are faster than this
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceSection;