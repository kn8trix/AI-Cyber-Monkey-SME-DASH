# Dashboard Design System & Refactor Guide

## Overview
Modern, minimalist dashboard UI with multi-tenant support, matching Invowise aesthetic. Clean typography, rounded corners, soft colors with orange accents.

---

## Color Palette

### Primary Colors
- **Orange**: `#f97316` - Primary action, highlights, accents
- **White**: `#ffffff` - Card backgrounds, main content area
- **Gray-50**: `#f9fafb` - Page background
- **Gray-100**: `#f3f4f6` - Subtle backgrounds, borders
- **Gray-900**: `#111827` - Main text

### Semantic Colors
- **Success (Green)**: `#10b981` - Active status, positive trends
- **Warning (Yellow)**: `#eab308` - Pending status
- **Danger (Red)**: `#ef4444` - Suspended, errors
- **Info (Blue)**: `#3b82f6` - Information

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Scale
- **Display (H1)**: 30px / 36px, Font Weight 700
- **Heading 2 (H2)**: 24px / 30px, Font Weight 700
- **Heading 3 (H3)**: 18px / 28px, Font Weight 700
- **Body Large**: 16px / 24px, Font Weight 400/500
- **Body Regular**: 14px / 20px, Font Weight 400/500
- **Body Small**: 12px / 16px, Font Weight 400/500
- **Caption**: 11px / 14px, Font Weight 500

---

## Components

### 1. DashboardHeader
Clean, minimal header with navigation tabs and user controls.

**Features:**
- Logo + brand name
- Navigation tabs (Overview, Stores, Reports, Settings)
- Search bar (hidden on mobile)
- Settings, Notifications, Profile icons
- Profile dropdown menu

**Usage:**
```tsx
<DashboardHeader userName="Akrom" />
```

**Props:**
- `userName?: string` - Display name in header
- `onMenuToggle?: () => void` - Callback for mobile menu
- `menuOpen?: boolean` - Mobile menu state

---

### 2. MetricCards
Three-card horizontal metric display at top of dashboard.

**Features:**
- Large metric value display
- Trend indicator (green for +, red for -)
- Icon badges
- Hover effects

**Default Metrics:**
1. Total Revenue: `$47,250.00` (+20%)
2. New Customers: `284` (+12%)
3. Active Stores: `12` (-5%)

**Usage:**
```tsx
import { MetricCards } from './dashboard-index';

<MetricCards metrics={[
  {
    label: 'Total Revenue',
    value: '$47,250.00',
    trend: 20,
    period: 'from last month',
    icon: 'revenue'
  },
  // ... more metrics
]} />
```

**Props:**
- `metrics?: MetricCardData[]` - Array of metric objects
  - `label: string`
  - `value: string`
  - `trend: number` (percentage, can be negative)
  - `period: string`
  - `icon: 'revenue' | 'customers' | 'stores'`

---

### 3. CurrentBalances
Bar chart widget showing revenue trend.

**Features:**
- 6-month bar chart
- Current balance display
- Trend percentage
- Hover tooltips

**Usage:**
```tsx
import { CurrentBalances } from './dashboard-index';

<CurrentBalances
  currentBalance="15,890.00"
  trend={20}
  data={[
    { month: 'Jan', amount: 12 },
    { month: 'Feb', amount: 8 },
    // ... more months
  ]}
/>
```

**Props:**
- `data?: Array<{ month: string; amount: number }>`
- `currentBalance?: string`
- `trend?: number`

---

### 4. StoresTable
Full-featured table displaying all stores/domains.

**Features:**
- Multi-select checkboxes
- Status badges (Active, Suspended, Pending)
- Action buttons (View, Edit, Delete)
- Sortable columns
- Pagination controls
- Hover effects

**Columns:**
1. Store ID
2. Primary Domain
3. Created Date
4. Orders Today
5. Store Status
6. Action

**Usage:**
```tsx
import { StoresTable } from './dashboard-index';

<StoresTable
  stores={stores}
  onView={(store) => console.log('View', store)}
  onEdit={(store) => console.log('Edit', store)}
  onDelete={(store) => console.log('Delete', store)}
/>
```

**Props:**
- `stores?: StoreRecord[]`
- `onEdit?: (store) => void`
- `onDelete?: (store) => void`
- `onView?: (store) => void`

**StoreRecord Type:**
```tsx
interface StoreRecord {
  id: string;           // e.g., "STORE-001"
  domain: string;       // e.g., "store1.example.com"
  createdDate: string;  // e.g., "27 Jun 2025"
  ordersToday: number;  // e.g., 8
  status: 'active' | 'suspended' | 'pending';
  storeUrl?: string;    // Optional full URL
}
```

---

### 5. ActivityFeed
Vertical stack of recent activity/events.

**Features:**
- Color-coded activity types
- Expandable activity rows
- Timestamps and email indicators
- Scrollable list
- "See Detail" link

**Activity Types:**
- **Deployment**: Green - New storefront deployed
- **Order**: Blue - Order-related events
- **Alert**: Orange - Important alerts
- **Update**: Purple - System updates

**Usage:**
```tsx
import { ActivityFeed } from './dashboard-index';

<ActivityFeed
  activities={activities}
  onViewAll={() => console.log('View all')}
/>
```

**Props:**
- `activities?: ActivityItem[]`
- `onViewAll?: () => void`

**ActivityItem Type:**
```tsx
interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;     // e.g., "2 hours ago"
  email?: string;
  avatar?: string;       // Single character
  type: 'deployment' | 'order' | 'alert' | 'update';
}
```

---

### 6. AIStorefrontDeployer
AI-powered input card for describing new storefronts.

**Features:**
- Large textarea input
- Character counter (500 word limit)
- "Generate by AI" button
- Quick deploy action button
- Quick template buttons (Tech, Retail, Wellness)
- Loading state

**Usage:**
```tsx
import { AIStorefrontDeployer } from './dashboard-index';

<AIStorefrontDeployer
  onDeploy={(description) => console.log('Deploy:', description)}
  isLoading={false}
/>
```

**Props:**
- `onDeploy?: (description: string) => void`
- `isLoading?: boolean`

---

### 7. RefactoredDashboard
Complete dashboard container integrating all components.

**Layout:**
- Header at top
- Welcome message + date
- 3 metric cards
- Asymmetric grid:
  - **Left (2/3 width)**: CurrentBalances + StoresTable
  - **Right (1/3 width)**: ActivityFeed + AIStorefrontDeployer

**Usage:**
```tsx
import { RefactoredDashboard } from './dashboard-index';

<RefactoredDashboard
  userName="Akrom"
  onViewStore={(store) => handleViewStore(store)}
  onEditStore={(store) => handleEditStore(store)}
  onDeleteStore={(store) => handleDeleteStore(store)}
/>
```

**Props:**
- `userName?: string`
- `onAddNewStore?: () => void`
- `onViewStore?: (store) => void`
- `onEditStore?: (store) => void`
- `onDeleteStore?: (store) => void`

---

## Spacing & Layout

### Container
- Max Width: `1280px` (1280)
- Padding (Desktop): `32px` (8 * 4)
- Padding (Mobile): `16px` (4 * 4)
- Gap Between Sections: `32px` (8 * 4)
- Gap Between Components: `24px` (6 * 4)

### Cards
- Padding: `24px` (6 * 4)
- Border Radius: `16px` (rounded-2xl)
- Border: `1px solid rgb(229, 231, 235)` (border-gray-200)
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.1)` (shadow-sm)
- Shadow Hover: Slightly increased

### Buttons
- Padding (Primary): `10px 16px` (py-2.5 px-4)
- Border Radius: `8px` (rounded-lg)
- Font: `14px` semi-bold
- Transition: `150ms` ease-out

---

## Responsive Breakpoints

```tsx
// Mobile First
const breakpoints = {
  sm: '640px',   // Small phones
  md: '768px',   // Tablets
  lg: '1024px',  // Desktops
  xl: '1280px',  // Large desktops
};
```

### Responsive Behavior
- **Mobile (<768px)**: 
  - Single column layout
  - Full-width cards
  - Hidden search bar
  - Hidden nav tabs
  
- **Tablet (768px-1024px)**:
  - 2-column grid
  - Compact spacing
  
- **Desktop (>1024px)**:
  - 3-column asymmetric grid
  - Full navigation
  - All features visible

---

## Interaction Patterns

### Hover States
- Cards: Subtle shadow increase, no background change
- Buttons: Background color change (primary → darker shade)
- Table rows: Light gray background (`bg-gray-50`)
- Icons: Color change to primary color

### Click/Active States
- Buttons: Darker shade + slight scale down
- Navigation tabs: Orange background + orange text
- Status badges: No interaction

### Loading States
- Buttons: Disabled (opacity-50, no hover)
- Input: Disabled (cursor-not-allowed)
- Spinner: Animated pulse indicator

---

## Dark Mode (Optional)

If implementing dark mode, use these color mappings:
```tsx
// Light Mode
const colors = {
  bg: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
};

// Dark Mode
const colorsDark = {
  bg: '#1f2937',
  border: '#374151',
  text: '#f9fafb',
};
```

---

## Integration with Existing Code

### Step 1: Import Dashboard Components
```tsx
import { RefactoredDashboard } from './components/dashboard-index';
```

### Step 2: Replace Old Dashboard Component
```tsx
// Before
<SmeProfileManager {...props} />

// After
<RefactoredDashboard
  userName={userName}
  onViewStore={handleView}
  onEditStore={handleEdit}
  onDeleteStore={handleDelete}
/>
```

### Step 3: Add Required Data Fetching
```tsx
// Fetch stores from API
const [stores, setStores] = useState<StoreRecord[]>([]);

useEffect(() => {
  fetch('/api/admin/tenants')
    .then(res => res.json())
    .then(data => setStores(transformToStoreRecords(data)));
}, []);
```

### Step 4: Connect to Multi-Tenant System
```tsx
// Transform tenant data to store records
const transformToStoreRecords = (tenants: any[]): StoreRecord[] => {
  return tenants.map(tenant => ({
    id: tenant.id,
    domain: tenant.domain,
    createdDate: new Date(tenant.created_at).toLocaleDateString(),
    ordersToday: tenant.orders_today || 0,
    status: tenant.status,
    storeUrl: `https://${tenant.domain}`
  }));
};
```

---

## Tailwind CSS Configuration

Ensure these classes are available in your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        orange: { 50: '#fff7ed', 500: '#f97316', 600: '#ea580c', 700: '#c2410c' },
      },
      borderRadius: {
        '2xl': '16px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
};
```

---

## Best Practices

1. **Always pass real data** - Use actual store records, activities, metrics from your API
2. **Handle loading states** - Show spinners while fetching data
3. **Responsive testing** - Test on mobile, tablet, desktop
4. **Accessibility** - Include alt text, proper ARIA labels
5. **Performance** - Lazy load large datasets, virtualize long lists
6. **Error handling** - Display error messages in context
7. **Feedback** - Show toast notifications for user actions

---

## Component Dependencies

```
RefactoredDashboard
├── DashboardHeader
├── MetricCards
├── CurrentBalances
├── StoresTable
├── ActivityFeed
└── AIStorefrontDeployer

External Dependencies:
├── React 19+
├── Tailwind CSS 3+
├── lucide-react (icons)
└── TypeScript (optional but recommended)
```

---

## Migration Checklist

- [ ] Create `src/components/DashboardHeader.tsx`
- [ ] Create `src/components/MetricCards.tsx`
- [ ] Create `src/components/CurrentBalances.tsx`
- [ ] Create `src/components/StoresTable.tsx`
- [ ] Create `src/components/ActivityFeed.tsx`
- [ ] Create `src/components/AIStorefrontDeployer.tsx`
- [ ] Create `src/components/RefactoredDashboard.tsx`
- [ ] Create `src/components/dashboard-index.ts`
- [ ] Update `App.tsx` to use `RefactoredDashboard`
- [ ] Update API integration to fetch real data
- [ ] Test responsive layout (mobile, tablet, desktop)
- [ ] Test all interactive features
- [ ] Verify dark mode (if applicable)
- [ ] Performance optimization
- [ ] Accessibility audit

---

## API Integration Requirements

### Endpoints to Connect

#### 1. Fetch Tenants (Stores)
```typescript
// GET /api/admin/tenants
interface Tenant {
  id: string;
  domain: string;
  name: string;
  created_at: string;
  status: 'active' | 'suspended' | 'pending';
  orders_today?: number;
}
```

#### 2. Fetch Metrics
```typescript
// GET /api/admin/metrics
interface Metrics {
  totalRevenue: number;
  newCustomers: number;
  activeStores: number;
  trends: { revenue: number; customers: number; stores: number; }
}
```

#### 3. Fetch Activity Feed
```typescript
// GET /api/admin/activities
interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  timestamp: string;
  user_email?: string;
}
```

#### 4. Deploy Storefront
```typescript
// POST /api/admin/provision
// Request
interface ProvisionRequest {
  domain: string;
  description: string;
  style: 'tech' | 'retail' | 'wellness';
}
// Response
interface ProvisionResponse {
  id: string;
  domain: string;
  status: string;
}
```

---

## Support & Customization

All components accept standard Tailwind CSS classes and can be extended via props. Refer to individual component documentation for full prop lists.

For custom styling, modify the Tailwind classes directly in component files.
