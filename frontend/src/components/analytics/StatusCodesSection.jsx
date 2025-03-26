import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

const StatusCodesSection = ({ data = [] }) => {
  const [viewType, setViewType] = useState('chart');

  // No data state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Code Distribution</CardTitle>
          <CardDescription>
            No status code data available for this API
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group status codes by category
  const statusGroups = {
    '2xx': {
      name: 'Success (2xx)',
      color: '#10B981', // green
      count: 0,
      percentage: 0,
    },
    '3xx': {
      name: 'Redirection (3xx)',
      color: '#3B82F6', // blue
      count: 0,
      percentage: 0,
    },
    '4xx': {
      name: 'Client Error (4xx)',
      color: '#F59E0B', // amber
      count: 0,
      percentage: 0,
    },
    '5xx': {
      name: 'Server Error (5xx)',
      color: '#EF4444', // red
      count: 0,
      percentage: 0,
    },
  };

  // Calculate totals by group
  data.forEach((item) => {
    const firstDigit = Math.floor(item.statusCode / 100);
    const group = `${firstDigit}xx`;
    if (statusGroups[group]) {
      statusGroups[group].count += item.count;
      statusGroups[group].percentage += item.percentage;
    }
  });

  // Prepare data for pie chart
  const pieData = Object.values(statusGroups).filter((group) => group.count > 0);

  // Get status code badge color
  const getStatusCodeBadge = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'info';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    return 'destructive';
  };

  // Get status code text
  const getStatusCodeText = (statusCode) => {
    const codeMap = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return codeMap[statusCode] || 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Status Code Distribution</CardTitle>
            <CardDescription>
              See how your API's responses are distributed across status codes
            </CardDescription>
          </div>

          <Tabs
            value={viewType}
            onValueChange={setViewType}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {viewType === 'chart' ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie chart */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Status Code Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                        label={({name, percent}) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => value.toLocaleString()}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Overview stats */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Status Code Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(statusGroups).map(([code, group]) => (
                    <div key={code} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{group.name}</span>
                        <span>{group.count.toLocaleString()} calls</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${group.percentage}%`, 
                            backgroundColor: group.color 
                          }}
                        />
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {group.percentage.toFixed(1)}% of total calls
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.statusCode}>
                    <TableCell>
                      <Badge variant={getStatusCodeBadge(item.statusCode)}>
                        {item.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusCodeText(item.statusCode)}</TableCell>
                    <TableCell className="text-right">{item.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusCodesSection;