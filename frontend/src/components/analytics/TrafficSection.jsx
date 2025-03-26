import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from 'recharts';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

const TrafficSection = ({ data, timeframe, onTimeframeChange }) => {
  const [metric, setMetric] = useState('calls');

  // No data state
  if (!data || !data.timeSeries || data.timeSeries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Traffic</CardTitle>
          <CardDescription>No traffic data available for the selected period</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.timeSeries.map(point => ({
    ...point,
    // Format timestamp based on timeframe
    date: formatTimestamp(point.timestamp, timeframe)
  }));

  // Function to format timestamp
  function formatTimestamp(timestamp, timeframe) {
    const date = new Date(timestamp);
    switch (timeframe) {
      case 'hour':
        return `${date.getHours()}:00`;
      case 'day':
        return `${date.getMonth() + 1}/${date.getDate()}`;
      case 'week':
        return `Week ${getWeekNumber(date)}`;
      case 'month':
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      default:
        return timestamp;
    }
  }

  // Helper to get week number
  function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Get chart props based on selected metric
  const getChartProps = () => {
    switch (metric) {
      case 'calls':
        return {
          label: 'Total Calls',
          color: '#3B82F6', // blue
          dataKey: 'calls',
          yAxisLabel: 'Calls'
        };
      case 'errorRate':
        return {
          label: 'Error Rate',
          color: '#EF4444', // red
          dataKey: 'errorRate',
          yAxisLabel: 'Error Rate (%)'
        };
      case 'responseTime':
        return {
          label: 'Avg Response Time',
          color: '#10B981', // green
          dataKey: 'avgResponseTime',
          yAxisLabel: 'Response Time (ms)'
        };
      default:
        return {
          label: 'Total Calls',
          color: '#3B82F6',
          dataKey: 'calls',
          yAxisLabel: 'Calls'
        };
    }
  };

  const chartProps = getChartProps();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>API Traffic Over Time</CardTitle>
            <CardDescription>
              View call volume and performance trends
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calls">Total Calls</SelectItem>
                <SelectItem value="errorRate">Error Rate</SelectItem>
                <SelectItem value="responseTime">Response Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Hourly</SelectItem>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Metric summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Total Calls
              </div>
              <div className="text-2xl font-bold">
                {data.summary.totalCalls.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Avg Error Rate
              </div>
              <div className="text-2xl font-bold">
                {data.summary.errorRate.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Avg Response Time
              </div>
              <div className="text-2xl font-bold">
                {data.summary.avgResponseTime.toFixed(2)}ms
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main chart */}
        <div className="h-[400px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartProps.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartProps.color} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickMargin={10}
                axisLine={{ stroke: '#374151', opacity: 0.3 }}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#374151', opacity: 0.3 }}
                label={{
                  value: chartProps.yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#6B7280', fontSize: 12 }
                }}
              />
              <Tooltip
                formatter={(value) => {
                  if (metric === 'errorRate') return `${value.toFixed(2)}%`;
                  if (metric === 'responseTime') return `${value.toFixed(2)}ms`;
                  return value.toLocaleString();
                }}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#F9FAFB'
                }}
              />
              <Area
                name={chartProps.label}
                type="monotone"
                dataKey={chartProps.dataKey}
                stroke={chartProps.color}
                fillOpacity={1}
                fill="url(#colorMetric)"
              />
              {metric === 'errorRate' && (
                <ReferenceLine y={5} stroke="red" strokeDasharray="3 3" opacity={0.7}>
                  <Label
                    position="right"
                    value="5% threshold"
                    fill="#EF4444"
                    fontSize={10}
                  />
                </ReferenceLine>
              )}
              {metric === 'responseTime' && (
                <ReferenceLine 
                  y={data.summary.avgResponseTime} 
                  stroke="green" 
                  strokeDasharray="3 3" 
                  opacity={0.7} 
                />
              )}
              <Legend verticalAlign="top" height={36} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficSection;