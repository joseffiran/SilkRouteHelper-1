import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, FileText, Clock, CheckCircle, AlertCircle, Package } from "lucide-react";
import AppLayout from "@/components/AppLayout";

export default function ReportsPage() {
  const { user } = useAuth();

  const { data: shipments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/v1/shipments/"],
    enabled: !!user,
  });

  const stats = useMemo(() => {
    if (!shipments || shipments.length === 0) {
      return {
        total: 0,
        processing: 0,
        completed: 0,
        totalDocuments: 0,
        processedDocuments: 0,
        statusBreakdown: [],
        monthlyData: [],
        documentTypes: []
      };
    }

    const total = shipments.length;
    const processing = shipments.filter(s => s.status === 'processing').length;
    const completed = shipments.filter(s => s.status === 'completed').length;

    // Extract all documents
    const allDocuments = shipments.flatMap(s => s.documents || []);
    const totalDocuments = allDocuments.length;
    const processedDocuments = allDocuments.filter(d => d.status === 'completed').length;

    // Status breakdown for pie chart
    const statusBreakdown = [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Processing', value: processing, color: '#f59e0b' },
      { name: 'Draft', value: total - processing - completed, color: '#6b7280' }
    ].filter(item => item.value > 0);

    // Monthly data for bar chart
    const monthlyData = shipments.reduce((acc: any[], shipment) => {
      const month = new Date(shipment.created_at).toLocaleDateString('en-US', { month: 'short' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.shipments += 1;
      } else {
        acc.push({ month, shipments: 1 });
      }
      return acc;
    }, []);

    // Document types breakdown
    const documentTypes = allDocuments.reduce((acc: any[], doc) => {
      const existing = acc.find(item => item.type === doc.document_type);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ 
          type: doc.document_type,
          count: 1,
          label: doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        });
      }
      return acc;
    }, []);

    return {
      total,
      processing,
      completed,
      totalDocuments,
      processedDocuments,
      statusBreakdown,
      monthlyData,
      documentTypes
    };
  }, [shipments]);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const documentProcessingRate = stats.totalDocuments > 0 ? Math.round((stats.processedDocuments / stats.totalDocuments) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Analytics and insights for your customs declarations
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    All time declarations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processing</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.processing}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently in progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    Ready for download
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.processedDocuments} processed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Shipments Completed</span>
                    <span className="text-sm font-medium">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {stats.completed} of {stats.total} shipments completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Processing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Documents Processed</span>
                    <span className="text-sm font-medium">{documentProcessingRate}%</span>
                  </div>
                  <Progress value={documentProcessingRate} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {stats.processedDocuments} of {stats.totalDocuments} documents processed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            {stats.monthlyData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="shipments" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Status Distribution */}
              {stats.statusBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.statusBreakdown}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                          >
                            {stats.statusBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {stats.statusBreakdown.map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <div 
                            className="w-2 h-2 rounded-full mr-2" 
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}: {item.value}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Document Types */}
              {stats.documentTypes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.documentTypes.map((type, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{type.label}</span>
                          <Badge variant="secondary">{type.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {stats.total === 0 && (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
                  <p className="text-gray-500 mb-4">
                    Reports will appear here once you start creating shipments
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}