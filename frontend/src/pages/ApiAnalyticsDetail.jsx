import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import OverviewSection from "../components/analytics/OverviewSection";
import TrafficSection from "../components/analytics/TrafficSection";
import EndpointsSection from '../components/analytics/EndpointsSection';
import StatusCodesSection from '../components/analytics/StatusCodesSection';
import PerformanceSection from '../components/analytics/PerformanceSection';
import ConsumersSection from '../components/analytics/ConsumersSection';

const ApiAnalyticsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframeSelected, setTimeframeSelected] = useState('day');

  useEffect(() => {
    const fetchApiAnalytics = async () => {
      if (!id) return;
      setIsLoading(true);
      
      try {
        const token = await getAccessTokenSilently();
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
        
        const response = await fetch(`${baseUrl}/analytics/api/${id}/complete`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch API analytics');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setAnalytics(data.data);
        } else {
          toast.error('No analytics data available for this API');
        }
      } catch (error) {
        console.error('Error fetching API analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiAnalytics();
  }, [id, getAccessTokenSilently]);

  const loadTimeSeriesData = async (period = 'day') => {
    if (!id) return;
    
    try {
      const token = await getAccessTokenSilently();
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
      const startDate = format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(
        `${baseUrl}/analytics/api/${id}/timeseries?period=${period}&startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch time series data');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setTimeframeSelected(period);
        setAnalytics(prev => ({
          ...prev,
          timeSeries: data.data
        }));
      }
    } catch (error) {
      console.error('Error loading time series data:', error);
      toast.error('Failed to update time series data');
    }
  };

  const handleGoBack = () => {
    navigate('/analytics');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
        </div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
        <Skeleton className="h-80 rounded-lg mb-8" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analytics Not Available</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            We couldn't find analytics data for this API. This might be because the API hasn't been used yet.
          </p>
          <Button onClick={handleGoBack}>Return to Analytics Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analytics
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{analytics.apiInfo.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Analytics and performance metrics for {analytics.apiInfo.name}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline">{analytics.apiInfo.category}</Badge>
          <Badge variant="secondary">{analytics.apiInfo.pricingModel}</Badge>
        </div>
      </div>

      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mt-6"
      >
        <TabsList className="grid grid-cols-3 md:grid-cols-6 md:w-auto w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="status-codes">Status Codes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="consumers">Consumers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewSection data={analytics} />
        </TabsContent>

        <TabsContent value="traffic" className="mt-6">
          <TrafficSection
            data={analytics}
            timeframe={timeframeSelected}
            onTimeframeChange={loadTimeSeriesData}
          />
        </TabsContent>

        <TabsContent value="endpoints" className="mt-6">
          <EndpointsSection data={analytics.endpoints} />
        </TabsContent>

        <TabsContent value="status-codes" className="mt-6">
          <StatusCodesSection data={analytics.statusCodes} />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceSection 
            data={analytics.latencyPercentiles} 
            avgResponseTime={analytics.summary.avgResponseTime} 
          />
        </TabsContent>

        <TabsContent value="consumers" className="mt-6">
          <ConsumersSection 
            data={analytics.topConsumers} 
            geoData={analytics.geoDistribution}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiAnalyticsDetail;