# Backend-Frontend Architecture

This document explains how the backend and frontend are structured and connected.

## Overview

The Smart Router Dashboard is a full-stack application with a clear separation between frontend (React) and backend (Express.js) components.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ActivityOverview Component                          │   │
│  │  - Fetches data from API                             │   │
│  │  - Displays dynamic network slice information        │   │
│  │  - Handles activity type switching                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ HTTP Requests                     │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Service (src/shared/services/api.js)            │   │
│  │  - fetchNetworkSliceData()                           │   │
│  │  - fetchActivityTypes()                              │   │
│  │  - checkServerHealth()                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/REST
                          │ (via Vite Proxy)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes (server/routes/networkSlice.js)           │   │
│  │  - GET /api/network-slice/current                     │   │
│  │  - GET /api/network-slice/activities                  │   │
│  │  - GET /api/network-slice/slices                      │   │
│  │  - GET /api/network-slice/simulate                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Data Service (server/data/mockData.js)              │   │
│  │  - getNetworkSliceData()                              │   │
│  │  - getAllActivityTypes()                             │   │
│  │  - simulateDataUpdate()                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Data Models (server/models/networkSlice.js)          │   │
│  │  - NetworkSlice                                       │   │
│  │  - CurrentActivity                                    │   │
│  │  - PerformanceMetrics                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Interaction
- User selects an activity type from the dropdown (e.g., "Video Conference", "Normal Slice")
- `ActivityOverview` component's `handleActivityChange()` is triggered

### 2. Frontend Request
- `ActivityOverview` calls `fetchNetworkSliceData(activityType)` from the API service
- API service makes HTTP GET request to `/api/network-slice/current?activityType=Video Conference`

### 3. Vite Proxy
- Vite dev server proxies `/api/*` requests to `http://localhost:3001`
- This allows frontend to make API calls without CORS issues

### 4. Backend Processing
- Express route handler receives the request
- Calls `getNetworkSliceData(activityType)` from mock data service
- Service maps activity type to appropriate network slice configuration
- Returns structured data with slice, activity, and performance metrics

### 5. Response
- Backend sends JSON response with network slice data
- Frontend receives response and updates component state
- UI re-renders with new data (bandwidth, latency, packet loss, etc.)

## Key Components

### Frontend Components

#### ActivityOverview.jsx
- Main component displaying current activity and network slice
- Manages state for current activity type and network data
- Handles loading and error states
- Provides dropdown for switching between activity types

#### API Service (src/shared/services/api.js)
- Centralized API communication layer
- Handles all HTTP requests to backend
- Provides error handling and fallback logic
- Can be easily extended for additional endpoints

### Backend Components

#### Server Entry Point (server/index.js)
- Express server setup
- CORS configuration
- Route registration
- Server startup

#### Network Slice Routes (server/routes/networkSlice.js)
- RESTful API endpoints
- Request validation
- Error handling
- Response formatting

#### Mock Data Service (server/data/mockData.js)
- Generates realistic fake data for different scenarios
- Maps activity types to network slice configurations
- Provides data variations for simulation
- Easy to replace with real data source

#### Data Models (server/models/networkSlice.js)
- Type definitions and classes
- Ensures consistent data structure
- Provides type safety and validation

## Network Slice Mapping

The system automatically maps activity types to appropriate network slices:

| Activity Type        | Network Slice          | Bandwidth | Latency | Packet Loss | Priority      |
|---------------------|------------------------|-----------|---------|-------------|---------------|
| Video Conference    | Video Conferencing     | 45 Mbps   | 12ms    | 0%          | High          |
| Gaming              | Gaming                 | 35 Mbps   | 8ms     | 0%          | High          |
| Streaming           | Streaming              | 50 Mbps   | 18ms    | 0.1%        | Medium        |
| Web Browsing        | Normal                 | 25 Mbps   | 28ms    | 0.2%        | Normal        |
| File Download       | Normal                 | 25 Mbps   | 28ms    | 0.2%        | Medium        |
| Idle                | Normal                 | 25 Mbps   | 28ms    | 0.2%        | Low           |

## Error Handling

### Frontend
- API service catches network errors
- Falls back to default data if backend is unavailable
- Displays user-friendly error messages
- Provides retry functionality

### Backend
- Validates request parameters
- Returns structured error responses
- Handles missing or invalid activity types
- Logs errors for debugging

## Development Workflow

1. **Start Backend**: `npm run dev:server`
   - Server runs on port 3001
   - API endpoints available at `http://localhost:3001/api`

2. **Start Frontend**: `npm run dev`
   - Dev server runs on port 5173
   - Vite proxy forwards `/api/*` to backend

3. **Or Run Both**: `npm run dev:all`
   - Starts both servers concurrently
   - Uses `concurrently` package

## Future Enhancements

### Real-time Updates
- WebSocket integration for live data updates
- Server-sent events (SSE) for push notifications
- Automatic data refresh intervals

### Database Integration
- Replace mock data with database queries
- Store historical network slice data
- User preferences and settings

### Authentication
- User authentication and authorization
- API key management
- Rate limiting

### Advanced Features
- Machine learning for optimal slice selection
- Predictive analytics
- Integration with actual network hardware
- Multi-user support

## Testing

### Manual Testing
1. Start backend: `npm run dev:server`
2. Test API endpoint: `curl http://localhost:3001/api/network-slice/current?activityType=Video Conference`
3. Start frontend: `npm run dev`
4. Open browser: `http://localhost:5173`
5. Use dropdown to switch activity types
6. Verify data updates dynamically

### API Testing
Use tools like Postman or curl to test endpoints:
```bash
# Get current slice data
curl http://localhost:3001/api/network-slice/current?activityType=Gaming

# Get all activity types
curl http://localhost:3001/api/network-slice/activities

# Get simulated data
curl http://localhost:3001/api/network-slice/simulate?activityType=Video Conference
```

## Troubleshooting

### Backend not starting
- Check if port 3001 is available
- Verify Node.js version (16+)
- Check for syntax errors: `node --check server/index.js`

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check Vite proxy configuration in `vite.config.js`
- Verify CORS is enabled in backend

### Data not updating
- Check browser console for errors
- Verify API requests in Network tab
- Check backend logs for errors
- Ensure activity type is valid
