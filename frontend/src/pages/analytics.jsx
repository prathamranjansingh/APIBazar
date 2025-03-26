import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format, subDays } from 'date-fns';
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
  FileJson,
  FileText,
  Filter,
  Globe,
  HelpCircle,
  RefreshCcw,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import OverviewSection from '../components/analytics/OverviewSection';
import TrafficSection from '../components/analytics/TrafficSection';
import EndpointsSection from '../components/analytics/EndpointsSection';
import StatusCodesSection from '../components/analytics/StatusCodesSection';
import PerformanceSection from '../components/analytics/PerformanceSection';
import ConsumersSection from '../components/analytics/ConsumersSection';

// Analytics Dashboard Component
const Analytics = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedApi, setSelectedApi] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apis, setApis] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [timeframeSelected, setTimeframeSelected] = useState('month');

  // Fetch APIs when component mounts
  useEffect(() => {
    const fetchApis = async () => {
      try {
        setIsLoading(true);
        const token = await getAccessTokenSilently();
        console.log('token:', token);
        
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
        const response = await fetch(`${baseUrl}/analytics/my`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch APIs');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setApis(data.data);
          // Select the first API by default if available
          if (data.data.length > 0) {
            setSelectedApi(data.data[0]);
            fetchApiAnalytics(data.data[0].apiId);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching APIs:', error);
        toast.error('Failed to load your APIs');
        setIsLoading(false);
      }
    };
    fetchApis();
  }, [getAccessTokenSilently]);

  // Fetch detailed analytics for a specific API
  const fetchApiAnalytics = async (apiId) => {
    try {
      setIsLoading(true);
      const token = await getAccessTokenSilently();
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
      // Format date range for the API
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      const response = await fetch(
        `${baseUrl}/analytics/api/${apiId}/complete?timeframe=${timeframeSelected}&startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch API analytics');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setAnalytics(data.data);
      } else {
        toast.error('No analytics data available for this API');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching API analytics:', error);
      toast.error('Failed to load analytics data');
      setIsLoading(false);
    }
  };

  // Handle API selection change
  const handleApiChange = (apiId) => {
    const selected = apis.find(api => api.apiId === apiId);
    setSelectedApi(selected);
    fetchApiAnalytics(apiId);
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    if (selectedApi) {
      fetchApiAnalytics(selectedApi.apiId);
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (value) => {
    setTimeframeSelected(value);
    if (selectedApi) {
      fetchApiAnalytics(selectedApi.apiId);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    if (selectedApi) {
      toast.info('Refreshing analytics data...');
      fetchApiAnalytics(selectedApi.apiId);
    }
  };

  // Export analytics data as JSON
  const handleExportJson = () => {
    if (!analytics) return;
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `api-analytics-${selectedApi.api.name}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Export analytics as CSV
  const handleExportCsv = () => {
    if (!analytics) return;
    // Basic csv conversion for time series data
    const headers = 'Date,Total Calls,Success Calls,Failed Calls,Error Rate,Avg Response Time\n';
    const csvData = analytics.timeSeries.map(point =>
      `${point.timestamp},${point.calls},${point.successCalls},${point.failedCalls},${point.errorRate},${point.avgResponseTime}`
    ).join('\n');
    const csv = headers + csvData;
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csv);
    const exportFileDefaultName = `api-analytics-${selectedApi.api.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Filter APIs by search term
  const filteredApis = apis.filter(api =>
    api.api.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor performance and usage metrics for your APIs
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={!selectedApi || isLoading}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            disabled={!analytics}
          >
            <FileJson className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!analytics}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 mt-6">
        {/* API Selection Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Select API</CardTitle>
            <CardDescription>
              Choose an API to view its analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative w-full md:w-72">
                <Search className="absolute w-4 h-4 text-muted-foreground left-3 top-3" />
                <Input
                  placeholder="Search APIs..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={selectedApi?.apiId || ''}
                onValueChange={handleApiChange}
                disabled={isLoading || apis.length === 0}
              >
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue placeholder="Select an API" />
                </SelectTrigger>
                <SelectContent>
                  {filteredApis.map((api) => (
                    <SelectItem key={api.apiId} value={api.apiId}>
                      {api.api.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3 ml-auto">
                <div className="hidden md:block">
                  <p className="text-sm font-medium">Time Range:</p>
                </div>
                <DatePickerWithRange
                  value={dateRange}
                  onChange={handleDateRangeChange}
                />
                <Select
                  value={timeframeSelected}
                  onValueChange={handleTimeframeChange}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Timeframe" />
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

            {/* Selected API Info */}
            {selectedApi && (
              <div className="flex flex-wrap items-center gap-2 p-3 mt-4 border rounded-md">
                <Badge className="px-3 py-1">
                  {selectedApi.api.name}
                </Badge>
                <Badge variant="outline" className="px-2 py-1">
                  {selectedApi.api.category}
                </Badge>
                <Badge
                  variant={selectedApi.api.pricingModel === 'FREE' ? 'secondary' : 'default'}
                  className="px-2 py-1"
                >
                  {selectedApi.api.pricingModel}
                </Badge>
                <div className="ml-auto text-sm text-muted-foreground">
                  Total Calls: {selectedApi.totalCalls.toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          // Loading skeletons
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Skeleton className="h-32 rounded-lg" />
                  <Skeleton className="h-32 rounded-lg" />
                  <Skeleton className="h-32 rounded-lg" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full h-80 rounded-lg" />
              </CardContent>
            </Card>
          </div>
        ) : !selectedApi ? (
          // No API selected state
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <HelpCircle className="w-16 h-16 mb-4 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No API Selected</h3>
              <p className="max-w-md mb-6 text-center text-muted-foreground">
                Please select an API from the dropdown above to view analytics data.
              </p>
            </CardContent>
          </Card>
        ) : !analytics ? (
          // No analytics data state
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Activity className="w-16 h-16 mb-4 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No Analytics Data</h3>
              <p className="max-w-md mb-6 text-center text-muted-foreground">
                There is no analytics data available for this API yet. This could be because the API hasn't been used or was recently created.
              </p>
            </CardContent>
          </Card>
        ) : (
          // Display analytics data
          <div className="grid gap-6">
            {/* Tab navigation for different analytics views */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 lg:w-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="traffic">Traffic</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="status-codes">Status Codes</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="consumers">Consumers</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <OverviewSection data={analytics} />
              </TabsContent>

              {/* Traffic Tab */}
              <TabsContent value="traffic" className="mt-6">
                <TrafficSection 
                  data={analytics} 
                  timeframe={timeframeSelected} 
                  onTimeframeChange={handleTimeframeChange}
                />
              </TabsContent>

              {/* Endpoints Tab */}
              <TabsContent value="endpoints" className="mt-6">
                <EndpointsSection data={analytics.endpoints} />
              </TabsContent>

              {/* Status Codes Tab */}
              <TabsContent value="status-codes" className="mt-6">
                <StatusCodesSection data={analytics.statusCodes} />
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="mt-6">
                <PerformanceSection 
                  data={analytics.latencyPercentiles} 
                  avgResponseTime={analytics.summary.avgResponseTime}
                />
              </TabsContent>

              {/* Consumers Tab */}
              <TabsContent value="consumers" className="mt-6">
                <ConsumersSection 
                  data={analytics.topConsumers} 
                  geoData={analytics.geoDistribution}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;