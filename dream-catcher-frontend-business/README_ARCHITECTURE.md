# 项目架构说明

## 🏗️ 架构概览

本项目采用**模块化架构**，支持多个独立的 Dashboard，同时共享统一的设计系统。

```
smart-router/
├── src/
│   ├── shared/                    # 🔵 共享资源（两个 dashboard 共用）
│   │   └── styles/                 # 设计系统（Design System）
│   │       ├── design-tokens.css  # 所有设计变量
│   │       ├── base.css
│   │       ├── utilities.css
│   │       └── index.css
│   │
│   ├── dashboards/                 # 🟢 Dashboard 目录
│   │   ├── end-user/               # End User Dashboard
│   │   │   ├── components/         # 专用组件
│   │   │   └── App.jsx
│   │   └── business/               # Business Dashboard
│   │       ├── components/         # 专用组件
│   │       └── App.jsx
│   │
│   ├── App.jsx                     # 主应用入口
│   └── main.jsx                    # React 入口
```

---

## 🎯 核心设计原则

### 1. **单一设计系统源 (Single Source of Truth)**

所有设计变量定义在 `src/shared/styles/design-tokens.css`：

```css
:root {
  --color-primary: #E20074;
  --space-24: 24px;
  --radius-lg: 16px;
  /* ... 所有设计变量 */
}
```

**优势**：
- ✅ 修改一处，所有 dashboard 自动更新
- ✅ 确保视觉一致性
- ✅ 易于维护和扩展

### 2. **独立组件目录**

每个 dashboard 有独立的组件目录：

```
dashboards/
├── end-user/components/     # End User 专用组件
│   ├── Dashboard.jsx
│   ├── ActivityOverview.jsx
│   └── ...
└── business/components/      # Business 专用组件
    ├── BusinessDashboard.jsx
    └── ...
```

**优势**：
- ✅ 组件完全隔离，互不影响
- ✅ 可以独立开发和测试
- ✅ 命名不会冲突

### 3. **统一的样式导入**

两个 dashboard 都导入相同的设计系统：

```jsx
// End User Dashboard
import '../../shared/styles/index.css'

// Business Dashboard  
import '../../shared/styles/index.css'
```

**结果**：
- ✅ 使用相同的设计变量
- ✅ 保持视觉一致性
- ✅ 但组件样式独立

---

## 📝 使用示例

### End User Dashboard 组件

```jsx
// src/dashboards/end-user/components/Dashboard.jsx
import React from 'react'
import '../../shared/styles/index.css'  // 导入设计系统
import './Dashboard.css'

function Dashboard() {
  return (
    <div className="dashboard">
      {/* 使用设计系统变量 */}
    </div>
  )
}
```

```css
/* src/dashboards/end-user/components/Dashboard.css */
.dashboard {
  padding: var(--space-24);        /* 使用设计系统变量 */
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}
```

### Business Dashboard 组件

```jsx
// src/dashboards/business/components/BusinessDashboard.jsx
import React from 'react'
import '../../shared/styles/index.css'  // 导入相同的设计系统
import './BusinessDashboard.css'

function BusinessDashboard() {
  return (
    <div className="business-dashboard">
      {/* 使用相同的设计系统变量 */}
    </div>
  )
}
```

```css
/* src/dashboards/business/components/BusinessDashboard.css */
.business-dashboard {
  padding: var(--space-24);        /* 使用相同的变量 */
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}
```

---

## 🔒 隔离机制

### 1. **CSS 类名隔离**

每个 dashboard 使用不同的类名前缀：

- End User: `.dashboard`, `.activity-overview`, `.sidebar`
- Business: `.business-dashboard`, `.analytics`, `.reports`

**避免冲突**：
```css
/* End User */
.dashboard { ... }

/* Business */
.business-dashboard { ... }  /* 不同的类名，不会冲突 */
```

### 2. **组件文件隔离**

组件文件完全分离：

```
end-user/components/Dashboard.jsx    # End User 专用
business/components/Dashboard.jsx     # Business 专用（可以同名）
```

### 3. **样式文件隔离**

每个组件有自己的 CSS 文件：

```
end-user/components/Dashboard.css    # End User 样式
business/components/Dashboard.css     # Business 样式
```

---

## 🚀 开发新 Dashboard

### 步骤 1: 创建目录结构

```bash
mkdir -p src/dashboards/new-dashboard/components
```

### 步骤 2: 创建 App.jsx

```jsx
// src/dashboards/new-dashboard/App.jsx
import React from 'react'
import '../../shared/styles/index.css'  // 导入设计系统
import Dashboard from './components/Dashboard'

function NewDashboardApp() {
  return <Dashboard />
}

export default NewDashboardApp
```

### 步骤 3: 创建组件

```jsx
// src/dashboards/new-dashboard/components/Dashboard.jsx
import React from 'react'
import './Dashboard.css'

function Dashboard() {
  return (
    <div className="new-dashboard">
      {/* 使用设计系统变量 */}
    </div>
  )
}
```

### 步骤 4: 更新主 App.jsx

```jsx
// src/App.jsx
import NewDashboardApp from './dashboards/new-dashboard/App'
// 或通过路由切换
```

---

## ✅ 最佳实践

### 1. **始终使用设计系统变量**

```css
/* ✅ 正确 */
padding: var(--space-24);
color: var(--color-primary);

/* ❌ 避免 */
padding: 24px;
color: #E20074;
```

### 2. **使用唯一的类名前缀**

```css
/* ✅ End User Dashboard */
.end-user-dashboard { ... }
.end-user-card { ... }

/* ✅ Business Dashboard */
.business-dashboard { ... }
.business-card { ... }
```

### 3. **共享组件放在 shared/**

如果两个 dashboard 需要共用组件：

```
src/shared/components/common/
├── Button.jsx
├── Input.jsx
└── Modal.jsx
```

### 4. **保持组件独立性**

- 不要在一个 dashboard 中导入另一个 dashboard 的组件
- 如果需要共享功能，提取到 `shared/` 目录

---

## 🔍 验证清单

开发新功能时，确保：

- [ ] 导入了 `shared/styles/index.css`
- [ ] 使用了设计系统变量（`var(--variable-name)`）
- [ ] 类名使用了唯一前缀
- [ ] 组件文件在正确的 dashboard 目录下
- [ ] 没有跨 dashboard 导入组件

---

## 📚 相关文档

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - 设计系统详细文档
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构详细说明
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - 迁移指南
