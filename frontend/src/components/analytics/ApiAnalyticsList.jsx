import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import { ChevronRight, Activity, ArrowUpRight, AlertCircle, Clock } from 'lucide-react';
  import { Progress } from '@/components/ui/progress';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
  
  export const ApiAnalyticsList = ({ analytics, onViewDetails }) => {
    if (!analytics || analytics.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No API Analytics Available</h3>
          <p className="text-muted-foreground max-w-md">
            You haven't created any APIs yet or there's no usage data available.
          </p>
        </div>
      );
    }
  
    const sortedAnalytics = [...analytics].sort((a, b) => b.totalCalls - a.totalCalls);
  
    return (
      <div className="space-y-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API Name</TableHead>
                <TableHead className="hidden md:table-cell">Total Calls</TableHead>
                <TableHead className="hidden md:table-cell">Success Rate</TableHead>
                <TableHead className="hidden md:table-cell">Avg. Response Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAnalytics.map((item) => (
                <TableRow key={item.apiId}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[200px]">{item.api.name}</span>
                      <span className="text-xs text-muted-foreground">{item.api.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{item.totalCalls.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Progress value={100 - item.errorRate} className="h-2 w-16" />
                      <span>{(100 - item.errorRate).toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{item.responseTimeAvg.toFixed(2)}ms</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(item.apiId)}>
                      Details <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
  
        {/* Mobile view */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
          {sortedAnalytics.map((item) => (
            <Card key={item.apiId} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base truncate">{item.api.name}</CardTitle>
                <CardDescription>{item.api.category}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>{item.totalCalls.toLocaleString()} calls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{item.errorRate.toFixed(1)}% errors</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{item.responseTimeAvg.toFixed(2)}ms avg response</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" size="sm" onClick={() => onViewDetails(item.apiId)}>
                  View Details <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };