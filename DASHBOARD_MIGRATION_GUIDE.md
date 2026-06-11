# Dashboard UI Refactor - Implementation Guide

## Overview
This guide walks through migrating from the old dashboard UI to the new modern design system with multi-tenant support.

---

## Step 1: Replace Dashboard in App.tsx

### Before (Old Dashboard)
```tsx
import SmeProfileManager from "./components/SmeProfileManager";

// In your main App component
{viewMode === "dashboard" && (
  <SmeProfileManager
    profiles={profiles}
    activeProfileId={activeProfileId}
    onSwitchProfile={onSwitchProfile}
    onUpdateProfiles={setProfiles}
    onAddLog={handleAddLog}
  />
)}
```

### After (New Dashboard)
```tsx
import { RefactoredDashboard } from "./components/dashboard-index";
import type { StoreRecord } from "./components/dashboard-index";

// In your main App component
{viewMode === "dashboard" && (
  <RefactoredDashboard
    userName={userName}
    onViewStore={(store) => handleViewStore(store)}
    onEditStore={(store) => handleEditStore(store)}
    onDeleteStore={(store) => handleDeleteStore(store)}
  />
)}
```

---

## Step 2: Implement Store Management Handlers

```tsx
// Add these handlers to your App component

const handleViewStore = (store: StoreRecord) => {
  console.log('Viewing store:', store);
  // Navigate to store details page
  // Example: router.push(`/stores/${store.id}`);
};

const handleEditStore = (store: StoreRecord) => {
  console.log('Editing store:', store);
  // Open edit modal or navigate to edit page
  // Example: setEditingStore(store); setShowEditModal(true);
};

const handleDeleteStore = async (store: StoreRecord) => {
  if (!window.confirm(`Delete store ${store.domain}?`)) return;
  
  try {
    const response = await fetch(`/api/admin/tenants/${store.id}/delete`, {
      method: 'POST'
    });
    
    if (response.ok) {
      // Refresh stores list
      fetchStores();
      console.log('Store deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting store:', error);
  }
};
```

---

## Step 3: Fetch Real Data from API

### Add State Management
```tsx
const [stores, setStores] = useState<StoreRecord[]>([]);
const [metrics, setMetrics] = useState<MetricCardData[]>([]);
const [activities, setActivities] = useState<ActivityItem[]>([]);
const [isLoadingStores, setIsLoadingStores] = useState(false);

const userName = "Akrom"; // Or fetch from auth context
```

### Fetch Stores from Multi-Tenant API
```tsx
const fetchStores = async () => {
  setIsLoadingStores(true);
  try {
    const response = await fetch('/api/admin/tenants');
    const tenants = await response.json();
    
    // Transform tenant data to StoreRecord format
    const storeRecords: StoreRecord[] = tenants.map((tenant: any) => ({
      id: tenant.id,
      domain: tenant.domain,
      createdDate: new Date(tenant.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      ordersToday: tenant.orders_today || 0,
      status: tenant.status as 'active' | 'suspended' | 'pending',
      storeUrl: `https://${tenant.domain}`
    }));
    
    setStores(storeRecords);
  } catch (error) {
    console.error('Error fetching stores:', error);
  } finally {
    setIsLoadingStores(false);
  }
};

// Call on component mount
useEffect(() => {
  fetchStores();
}, []);
```

### Fetch Metrics
```tsx
const fetchMetrics = async () => {
  try {
    const response = await fetch('/api/admin/metrics');
    const data = await response.json();
    
    const metricCards: MetricCardData[] = [
      {
        label: 'Total Revenue',
        value: `$${data.totalRevenue.toLocaleString('en-US', { 
          minimumFractionDigits: 2 
        })}`,
        trend: data.trends.revenue,
        period: 'from last month',
        icon: 'revenue'
      },
      {
        label: 'New Customers',
        value: data.newCustomers.toString(),
        trend: data.trends.customers,
        period: 'from last month',
        icon: 'customers'
      },
      {
        label: 'Active Stores',
        value: data.activeStores.toString(),
        trend: data.trends.stores,
        period: 'from last week',
        icon: 'stores'
      }
    ];
    
    setMetrics(metricCards);
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
};

useEffect(() => {
  fetchMetrics();
}, []);
```

### Fetch Activities
```tsx
const fetchActivities = async () => {
  try {
    const response = await fetch('/api/admin/activities?limit=10');
    const activities = await response.json();
    
    const activityItems: ActivityItem[] = activities.map((activity: any) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      timestamp: formatTimeAgo(activity.created_at),
      email: activity.user_email,
      avatar: activity.user_email?.charAt(0).toUpperCase(),
      type: activity.type as 'deployment' | 'order' | 'alert' | 'update'
    }));
    
    setActivities(activityItems);
  } catch (error) {
    console.error('Error fetching activities:', error);
  }
};

useEffect(() => {
  fetchActivities();
}, []);

// Helper function to format timestamps
const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};
```

---

## Step 4: Update Component Imports

### Update dashboard-index.ts usage
```tsx
// Import all dashboard components at once
import {
  RefactoredDashboard,
  DashboardHeader,
  MetricCards,
  CurrentBalances,
  StoresTable,
  ActivityFeed,
  AIStorefrontDeployer
} from './components/dashboard-index';

// Or import types
import type {
  MetricCardData,
  StoreRecord,
  ActivityItem
} from './components/dashboard-index';
```

---

## Step 5: Integrate with Existing Features

### Connect AI Storefront Deployer
```tsx
const handleDeployStorefront = async (description: string) => {
  try {
    const response = await fetch('/api/admin/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: generateDomain(), // Your function
        description: description,
        plan: 'monthly'
      })
    });
    
    const result = await response.json();
    
    // Show success message
    console.log('Storefront deployed:', result);
    
    // Refresh stores list
    fetchStores();
    
    // Show notification
    // toast.success(`Store ${result.domain} deployed!`);
    
  } catch (error) {
    console.error('Error deploying storefront:', error);
    // toast.error('Failed to deploy storefront');
  }
};

// Helper to generate unique domain
const generateDomain = (): string => {
  return `store-${Date.now()}.example.com`;
};
```

### Connect Activity Feed to Multi-Tenant Events
```tsx
// Poll for new activities every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchActivities();
  }, 30000);
  
  return () => clearInterval(interval);
}, []);

// Or use WebSocket for real-time updates
useEffect(() => {
  const socket = new WebSocket(
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/activities/stream`
  );
  
  socket.onmessage = (event) => {
    const activity = JSON.parse(event.data);
    setActivities(prev => [activity, ...prev.slice(0, 9)]);
  };
  
  return () => socket.close();
}, []);
```

---

## Step 6: Pass Handlers to Dashboard

```tsx
<RefactoredDashboard
  userName={userName}
  onViewStore={handleViewStore}
  onEditStore={handleEditStore}
  onDeleteStore={handleDeleteStore}
/>
```

---

## Step 7: Styling Customization

### Customize Colors
Edit Tailwind classes in component files:
```tsx
// In DashboardHeader.tsx - Change primary color from orange to your brand color
className="bg-orange-500"  // → className="bg-blue-500"
```

### Adjust Spacing
```tsx
// In RefactoredDashboard.tsx - Change gap between sections
<div className="gap-6">  // → <div className="gap-4"> or <div className="gap-8">
```

### Change Typography
```tsx
// In MetricCards.tsx - Adjust text sizes
<h3 className="text-2xl">  // → <h3 className="text-3xl"> or <h3 className="text-xl">
```

---

## API Endpoints Required

Make sure your backend provides these endpoints:

### 1. Get All Stores/Tenants
```
GET /api/admin/tenants

Response:
[
  {
    id: "store_123",
    domain: "store1.example.com",
    name: "Store 1",
    created_at: "2025-06-20T10:00:00Z",
    status: "active",
    orders_today: 8
  },
  ...
]
```

### 2. Get Metrics
```
GET /api/admin/metrics

Response:
{
  totalRevenue: 47250.00,
  newCustomers: 284,
  activeStores: 12,
  trends: {
    revenue: 20,
    customers: 12,
    stores: -5
  }
}
```

### 3. Get Activities
```
GET /api/admin/activities?limit=10

Response:
[
  {
    id: "activity_1",
    title: "New Storefront Deployed",
    description: "store1.example.com successfully deployed",
    type: "deployment",
    created_at: "2025-06-26T10:00:00Z",
    user_email: "admin@company.com"
  },
  ...
]
```

### 4. Provision New Storefront
```
POST /api/admin/provision

Request:
{
  domain: "newstore.example.com",
  description: "A description of the new storefront",
  plan: "monthly"
}

Response:
{
  id: "store_456",
  domain: "newstore.example.com",
  status: "active",
  tenantId: "store_456"
}
```

### 5. Delete Store/Tenant
```
POST /api/admin/tenants/{id}/delete

Response:
{
  success: true,
  message: "Store deleted successfully"
}
```

---

## Environment Configuration

Add these to your `.env` file:

```env
# Dashboard API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_ADMIN_API_PREFIX=/api/admin
VITE_ACTIVITY_STREAM_URL=ws://localhost:3000/api/activities/stream

# Feature Flags
VITE_ENABLE_REAL_TIME_ACTIVITIES=true
VITE_METRICS_REFRESH_INTERVAL=30000  # 30 seconds
```

---

## Performance Optimization

### Implement Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

const RefactoredDashboard = lazy(() => 
  import('./components/RefactoredDashboard')
);

// In your component
<Suspense fallback={<DashboardSkeleton />}>
  <RefactoredDashboard {...props} />
</Suspense>
```

### Implement Data Caching
```tsx
const cache = new Map<string, { data: any; timestamp: number }>();

const fetchWithCache = async (url: string, cacheTime = 60000) => {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < cacheTime) {
    return cached.data;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
};
```

---

## Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Metric cards display correct values
- [ ] Chart renders with proper data
- [ ] Store table shows all records
- [ ] Activity feed displays activities
- [ ] AI deployer input accepts text
- [ ] All buttons are clickable
- [ ] Responsive layout works on mobile
- [ ] Responsive layout works on tablet
- [ ] Responsive layout works on desktop
- [ ] Hover effects work on all interactive elements
- [ ] Status badges show correct colors
- [ ] Pagination controls work
- [ ] Search filters work (if implemented)
- [ ] Real-time updates work (if implemented)

---

## Troubleshooting

### Issue: Components not rendering
**Solution**: Ensure all imports are correct and components are exported from `dashboard-index.ts`

### Issue: Styling looks wrong
**Solution**: Verify Tailwind CSS is properly configured and all classes are in your build

### Issue: Data not loading
**Solution**: Check API endpoints exist and return correct data format

### Issue: Responsive layout broken
**Solution**: Verify you're using Tailwind breakpoints (sm:, md:, lg:, xl:)

### Issue: Performance is slow
**Solution**: Implement data caching and lazy loading as shown above

---

## Next Steps

1. ✅ Replace old dashboard with new components
2. ✅ Connect to API endpoints
3. ✅ Test all features
4. ✅ Customize styling to match brand
5. ✅ Implement real-time updates (optional)
6. ✅ Add analytics tracking
7. ✅ Deploy to production
