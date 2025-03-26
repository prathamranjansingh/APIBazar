import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Clock, Search, AlertTriangle, Activity } from 'lucide-react';

const EndpointsSection = ({ data = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('calls');
  const [sortOrder, setSortOrder] = useState('desc');

  // Handle no data state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Performance</CardTitle>
          <CardDescription>
            No endpoint data available for this API
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Filter and sort endpoints
  const filteredEndpoints = data
    .filter(ep => ep.endpoint.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      return multiplier * (a[sortBy] - b[sortBy]);
    });

  // Get top 5 endpoints for the chart
  const topEndpoints = [...filteredEndpoints]
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 5)
    .map(ep => ({
      name: truncateEndpoint(ep.endpoint),
      calls: ep.calls,
      fullEndpoint: ep.endpoint
    }));

  // Helper to truncate long endpoint names
  function truncateEndpoint(endpoint, maxLength = 25) {
    if (endpoint.length <= maxLength) return endpoint;
    return endpoint.substring(0, maxLength) + '...';
  }

  // Toggle sort order
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Bar chart colors
  const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Chart card */}
      <Card>
        <CardHeader>
          <CardTitle>Top Endpoints by Usage</CardTitle>
          <CardDescription>
            The most frequently called endpoints in your API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topEndpoints}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => truncateEndpoint(value, 20)}
                />
                <Tooltip
                  formatter={(value) => [value.toLocaleString(), "Calls"]}
                  labelFormatter={(value) => `Endpoint: ${value}`}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                />
                <Bar
                  dataKey="calls"
                  name="Calls"
                  radius={[0, 4, 4, 0]}
                >
                  {topEndpoints.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Performance</CardTitle>
          <CardDescription>
            Detailed metrics for all endpoints in your API
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search bar */}
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search endpoints..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table of endpoints */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Endpoint</TableHead>
                  <TableHead
                    className="w-[15%] cursor-pointer"
                    onClick={() => toggleSort('calls')}
                  >
                    <div className="flex items-center">
                      Calls
                      {sortBy === 'calls' && (
                        sortOrder === 'desc' ? ' ↓' : ' ↑'
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[20%] cursor-pointer"
                    onClick={() => toggleSort('errorRate')}
                  >
                    <div className="flex items-center">
                      Error Rate
                      {sortBy === 'errorRate' && (
                        sortOrder === 'desc' ? ' ↓' : ' ↑'
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[25%] cursor-pointer"
                    onClick={() => toggleSort('avgResponseTime')}
                  >
                    <div className="flex items-center">
                      Avg. Response Time
                      {sortBy === 'avgResponseTime' && (
                        sortOrder === 'desc' ? ' ↓' : ' ↑'
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEndpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {endpoint.endpoint}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>{endpoint.calls.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {endpoint.errorRate > 5 && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <Progress
                          value={100 - endpoint.errorRate}
                          className="h-2 w-16"
                          indicator={endpoint.errorRate > 10 ? "bg-red-500" : ""}
                        />
                        <span>{endpoint.errorRate.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{endpoint.avgResponseTime.toFixed(2)}ms</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EndpointsSection;