import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Users, Globe } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

const ConsumersSection = ({ data = [], geoData = [] }) => {
  const [activeTab, setActiveTab] = useState('consumers');
  
  // Generate colors
  const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // No data states
  const noConsumerData = !data || data.length === 0;
  const noGeoData = !geoData || geoData.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>API Usage Analysis</CardTitle>
            <CardDescription>
              Who is using your API and from where
            </CardDescription>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consumers">
                <Users className="h-4 w-4 mr-2" />
                Consumers
              </TabsTrigger>
              <TabsTrigger value="geography">
                <Globe className="h-4 w-4 mr-2" />
                Geography
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="consumers" className="mt-0">
          {noConsumerData ? (
            <div className="text-center py-10">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Consumer Data Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                There's no consumer data available yet. This could be because all API calls were made anonymously or there haven't been any calls.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consumer ID</TableHead>
                    <TableHead className="text-right">Total Calls</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead className="text-right">Avg. Response Time</TableHead>
                    <TableHead className="hidden md:table-cell">Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((consumer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {consumer.consumerName || consumer.consumerId}
                      </TableCell>
                      <TableCell className="text-right">
                        {consumer.totalCalls.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <Progress
                            value={consumer.successRate}
                            className="h-2 w-16"
                          />
                          <span>{consumer.successRate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {consumer.avgResponseTime.toFixed(2)}ms
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{format(new Date(consumer.lastUsed), 'MMM d, yyyy')}</span>
                          <span className="text-xs">
                            {formatDistanceToNow(new Date(consumer.lastUsed), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="geography" className="mt-0">
          {noGeoData ? (
            <div className="text-center py-10">
              <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">No Geographic Data Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                There's no geographic data available yet. This may be because location tracking is not enabled or there haven't been any calls.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Geo chart */}
              <div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={geoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="calls"
                        nameKey="country"
                        label={({country, percent}) =>
                          `${country}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {geoData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
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
              </div>
              
              {/* Table view */}
              <div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {geoData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.country || 'Unknown'}</TableCell>
                          <TableCell className="text-right">
                            {item.calls.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.percentage.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default ConsumersSection;