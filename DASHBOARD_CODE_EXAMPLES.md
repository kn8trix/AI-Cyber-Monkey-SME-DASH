// Dashboard Components - Usage Showcase
// Copy and paste examples for quick implementation

// ============================================================================
// 1. BASIC DASHBOARD SETUP
// ============================================================================

import React, { useState, useEffect } from 'react';
import { RefactoredDashboard } from './components/dashboard-index';
import type { StoreRecord } from './components/dashboard-index';

export default function DashboardPage() {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/tenants');
      const tenants = await response.json();
      setStores(tenants.map(tenant => ({
        id: tenant.id,
        domain: tenant.domain,
        createdDate: new Date(tenant.created_at).toLocaleDateString(),
        ordersToday: tenant.orders_today || 0,
        status: tenant.status,
        storeUrl: `https://${tenant.domain}`
      })));
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStore = (store: StoreRecord) => {
    window.open(`/stores/${store.id}`, '_blank');
  };

  const handleEditStore = (store: StoreRecord) => {
    // Navigate to edit page
    console.log('Edit store:', store);
  };

  const handleDeleteStore = async (store: StoreRecord) => {
    if (!window.confirm(`Delete ${store.domain}?`)) return;
    
    try {
      await fetch(`/api/admin/tenants/${store.id}/delete`, { method: 'POST' });
      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
    }
  };

  return (
    <RefactoredDashboard
      userName="Akrom"
      onViewStore={handleViewStore}
      onEditStore={handleEditStore}
      onDeleteStore={handleDeleteStore}
    />
  );
}


// ============================================================================
// 2. INDIVIDUAL COMPONENT USAGE
// ============================================================================

import {
  DashboardHeader,
  MetricCards,
  CurrentBalances,
  StoresTable,
  ActivityFeed,
  AIStorefrontDeployer
} from './components/dashboard-index';

/*
// Header
<DashboardHeader userName="Akrom" />

// Metrics
<MetricCards metrics={[
  {
    label: 'Total Revenue',
    value: '$47,250.00',
    trend: 20,
    period: 'from last month',
    icon: 'revenue'
  },
  {
    label: 'New Customers',
    value: '284',
    trend: 12,
    period: 'from last month',
    icon: 'customers'
  },
  {
    label: 'Active Stores',
    value: '12',
    trend: -5,
    period: 'from last week',
    icon: 'stores'
  }
]} />

// Chart
<CurrentBalances
  currentBalance="15,890.00"
  trend={20}
  data={[
    { month: 'Jan', amount: 12 },
    { month: 'Feb', amount: 8 },
    { month: 'Mar', amount: 14 },
    { month: 'Apr', amount: 9 },
    { month: 'May', amount: 11 },
    { month: 'Jun', amount: 18 }
  ]}
/>

// Table
<StoresTable
  stores={stores}
  onView={(store) => console.log('View:', store)}
  onEdit={(store) => console.log('Edit:', store)}
  onDelete={(store) => console.log('Delete:', store)}
/>

// Activity Feed
<ActivityFeed
  activities={[
    {
      id: '1',
      title: 'New Storefront Deployed',
      description: 'store1.example.com successfully deployed',
      timestamp: '2 hours ago',
      email: 'admin@company.com',
      avatar: 'A',
      type: 'deployment'
    }
  ]}
/>

// AI Deployer
<AIStorefrontDeployer
  onDeploy={(description) => console.log('Deploy:', description)}
  isLoading={false}
/>
*/

// ============================================================================
// 3. ADVANCED: WITH REAL-TIME UPDATES
// ============================================================================

import { useEffect, useCallback } from 'react';

export default function AdvancedDashboard() {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [activities, setActivities] = useState([]);

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(
      `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/stream`
    );

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);
      
      if (event.type === 'store_created') {
        setStores(prev => [event.data, ...prev]);
      }
      
      if (event.type === 'activity') {
        setActivities(prev => [event.data, ...prev.slice(0, 9)]);
      }
    };

    return () => ws.close();
  }, []);

  // Refresh interval (fallback for non-WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStores();
      fetchActivities();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return <RefactoredDashboard {...props} />;
}


// ============================================================================
// 4. WITH DATA CACHING
// ============================================================================

const apiCache = new Map();

async function fetchWithCache(url, cacheTime = 60000) {
  const cached = apiCache.get(url);
  if (cached && Date.now() - cached.timestamp < cacheTime) {
    return cached.data;
  }

  const response = await fetch(url);
  const data = await response.json();
  apiCache.set(url, { data, timestamp: Date.now() });
  return data;
}

// Usage
const stores = await fetchWithCache('/api/admin/tenants');
const metrics = await fetchWithCache('/api/admin/metrics');
const activities = await fetchWithCache('/api/admin/activities');


// ============================================================================
// 5. WITH ERROR HANDLING & RETRY LOGIC
// ============================================================================

async function fetchStoresWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/admin/tenants');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) {
        throw new Error('Failed to fetch stores after ' + maxRetries + ' attempts');
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

// Usage in component
useEffect(() => {
  fetchStoresWithRetry()
    .then(setStores)
    .catch(error => {
      console.error('Fatal error:', error);
      // Show error toast/notification
    });
}, []);


// ============================================================================
// 6. CUSTOM STYLING OVERRIDE
// ============================================================================

// Create a custom styled wrapper
const StyledDashboard = styled(RefactoredDashboard)`
  /* Override colors */
  --color-primary: #3b82f6; /* Blue instead of orange */
  --color-bg: #f0f9ff; /* Light blue background */
  
  /* Modify component styles */
  .metric-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .stores-table {
    font-size: 13px;
  }
  
  .activity-feed {
    max-height: 500px;
  }
`;


// ============================================================================
// 7. INTEGRATION WITH STATE MANAGEMENT (Redux/Zustand)
// ============================================================================

import { useSelector, useDispatch } from 'react-redux';

export default function ReduxDashboard() {
  const dispatch = useDispatch();
  const {
    stores,
    metrics,
    activities,
    loading,
    error
  } = useSelector(state => state.dashboard);

  useEffect(() => {
    dispatch(fetchStores());
    dispatch(fetchMetrics());
    dispatch(fetchActivities());
  }, [dispatch]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} />;

  return (
    <RefactoredDashboard
      stores={stores}
      metrics={metrics}
      activities={activities}
      onViewStore={(store) => dispatch(viewStore(store))}
      onEditStore={(store) => dispatch(editStore(store))}
      onDeleteStore={(store) => dispatch(deleteStore(store))}
    />
  );
}


// ============================================================================
// 8. RESPONSIVE CUSTOMIZATION
// ============================================================================

// Custom responsive wrapper
const ResponsiveDashboard = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <RefactoredDashboard
      {...props}
      // Customize layout based on device
      showMetricCards={true}
      showActivityFeed={!isMobile}
      showAIDeployer={!isMobile}
      maxStoresPerPage={isMobile ? 5 : 20}
    />
  );
};


// ============================================================================
// 9. WITH NOTIFICATIONS/TOASTS
// ============================================================================

import { toast } from 'react-hot-toast';

const handleDeleteStore = async (store) => {
  const loadingToast = toast.loading('Deleting store...');
  
  try {
    await fetch(`/api/admin/tenants/${store.id}/delete`, { method: 'POST' });
    toast.dismiss(loadingToast);
    toast.success(`Store ${store.domain} deleted`);
    fetchStores();
  } catch (error) {
    toast.dismiss(loadingToast);
    toast.error('Failed to delete store');
  }
};

const handleDeploy = async (description) => {
  const toastId = toast.loading('Deploying storefront...');
  
  try {
    const response = await fetch('/api/admin/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    
    const result = await response.json();
    toast.dismiss(toastId);
    toast.success(`Store ${result.domain} deployed!`);
    fetchStores();
  } catch (error) {
    toast.dismiss(toastId);
    toast.error('Deployment failed');
  }
};


// ============================================================================
// 10. PERFORMANCE OPTIMIZATION - VIRTUALIZATION
// ============================================================================

import { FixedSizeList as List } from 'react-window';

const VirtualizedStoresTable = ({ stores }) => (
  <List
    height={600}
    itemCount={stores.length}
    itemSize={60}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <StoreRow store={stores[index]} />
      </div>
    )}
  </List>
);


// ============================================================================
// 11. TESTING EXAMPLES
// ============================================================================

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('RefactoredDashboard', () => {
  it('renders header with correct title', () => {
    render(<RefactoredDashboard userName="Test User" />);
    expect(screen.getByText('Good Morning, Test User!')).toBeInTheDocument();
  });

  it('displays metric cards with correct values', () => {
    render(<MetricCards metrics={[
      {
        label: 'Total Revenue',
        value: '$47,250.00',
        trend: 20,
        period: 'from last month',
        icon: 'revenue'
      }
    ]} />);
    expect(screen.getByText('$47,250.00')).toBeInTheDocument();
  });

  it('handles delete store action', async () => {
    const handleDelete = jest.fn();
    const store = { id: '1', domain: 'test.com', createdDate: '2025-06-26', ordersToday: 5, status: 'active' };
    
    render(<StoresTable stores={[store]} onDelete={handleDelete} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    userEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalledWith(store);
    });
  });
});


// ============================================================================
// 12. ACCESSIBILITY CHECKLIST
// ============================================================================

/*
✅ Semantic HTML elements (header, main, nav, article, section)
✅ ARIA labels on interactive elements
✅ Keyboard navigation support (Tab, Enter, Escape)
✅ Color contrast ratios (WCAG AA minimum)
✅ Focus visible indicators
✅ Alt text on images
✅ Descriptive button labels
✅ Form labels associated with inputs
✅ Error messages linked to inputs
✅ Loading states announced
✅ Announcements for dynamic content updates
✅ Skip to main content link (recommended)
*/


// ============================================================================
// 13. QUICK START TEMPLATE
// ============================================================================

// app.tsx
import { RefactoredDashboard } from './components/dashboard-index';

function App() {
  return (
    <RefactoredDashboard
      userName="Akrom"
      onViewStore={(store) => console.log('view', store)}
      onEditStore={(store) => console.log('edit', store)}
      onDeleteStore={(store) => console.log('delete', store)}
    />
  );
}

export default App;


// ============================================================================
// 14. DEPLOYMENT CHECKLIST
// ============================================================================

/*
✅ Components compile without TypeScript errors
✅ All imports are correct
✅ Tailwind CSS classes are available
✅ Icons from lucide-react are installed
✅ Dark mode support (if needed)
✅ Loading states implemented
✅ Error handling in place
✅ API endpoints working
✅ Real-time updates configured (optional)
✅ Performance optimized
✅ Accessibility tested
✅ Mobile responsiveness verified
✅ Cross-browser testing done
✅ Analytics tracking added
✅ Error tracking/monitoring enabled
*/
