import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, TrendingDown, Clock, CheckCircle, ShieldAlert } from 'lucide-react';

const OverviewSection = ({ data }) => {
  const summary = data.summary;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Calls Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {summary.totalCalls.toLocaleString()}
              </div>
            </div>
          </CardContent>
          <div className="px-6 pb-4">
            <div className="flex items-center text-sm">
              {summary.percentChangeMonth >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">
                    {Math.abs(summary.percentChangeMonth).toFixed(1)}% increase
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {Math.abs(summary.percentChangeMonth).toFixed(1)}% decrease
                  </span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">this month</span>
            </div>
          </div>
        </Card>

        {/* Success Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {(100 - summary.errorRate).toFixed(1)}%
              </div>
            </div>
          </CardContent>
          <div className="px-6 pb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              {summary.successCalls.toLocaleString()} successful calls
              of {summary.totalCalls.toLocaleString()} total
            </div>
          </div>
        </Card>

        {/* Response Time Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{summary.avgResponseTime.toFixed(2)}ms</div>
            </div>
          </CardContent>
          <div className="px-6 pb-4">
            <div className="text-sm text-muted-foreground">
              Average across all API calls
            </div>
          </div>
        </Card>
      </div>

      {/* Time-Based Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.callsToday.toLocaleString()}</div>
          </CardContent>
          <div className="px-6 pb-4">
            <div className="flex items-center text-sm">
              {summary.percentChangeDay >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">
                    {Math.abs(summary.percentChangeDay).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {Math.abs(summary.percentChangeDay).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">vs yesterday</span>
            </div>
          </div>
        </Card>

        {/* This Week Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.callsThisWeek.toLocaleString()}</div>
          </CardContent>
          <div className="px-6 pb-4">
            <div className="flex items-center text-sm">
              {summary.percentChangeWeek >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">
                    {Math.abs(summary.percentChangeWeek).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {Math.abs(summary.percentChangeWeek).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">vs last week</span>
            </div>
          </div>
        </Card>

        {/* This Month Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.callsThisMonth.toLocaleString()}</div>
          </CardContent>
          <div className="px-6 pb-4">
            <div className="flex items-center text-sm">
              {summary.percentChangeMonth >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">
                    {Math.abs(summary.percentChangeMonth).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">
                    {Math.abs(summary.percentChangeMonth).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">vs last month</span>
            </div>
          </div>
        </Card>

        {/* Error Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShieldAlert className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{summary.errorRate.toFixed(1)}%</div>
            </div>
          </CardContent>
          <div className="px-6 pb-4">
            <div className="text-sm text-muted-foreground">
              {summary.failedCalls.toLocaleString()} failed calls
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OverviewSection;