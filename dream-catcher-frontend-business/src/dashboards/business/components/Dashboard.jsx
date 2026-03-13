// import React from 'react'
// import Sidebar from './Sidebar'
// import BusinessImpactCard from './BusinessImpactCard'
// import DemoSection from './demo/DemoSection'
// import './Dashboard.css'

// function Dashboard() {
//   return (
//     <div className="dashboard-layout">
//       <Sidebar />
//       <div className="dashboard">
//         <div className="dashboard-content">
//           <BusinessImpactCard />
//           <DemoSection />
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Dashboard



import React from 'react'
import { getVariant } from '../../../shared/utils/getSource'
import Sidebar from './Sidebar'
import BusinessImpactCard from './BusinessImpactCard'
import Overview from './Overview'
import DemoSection from './demo/DemoSection'
import './Dashboard.css'

function Dashboard() {
  const variant = getVariant();

  if (variant === 'b') {
    return (
      <div className="dashboard-layout variant-b">
        <div className="dashboard no-sidebar">
          <div className="dashboard-content-b">
            <div className="side-column">
              <BusinessImpactCard />
              <Overview />
            </div>
            <div className="main-column">
              <DemoSection variant={variant} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant C: No sidebar, BusinessImpactCard at top, cards horizontal
  if (variant === 'c') {
    return (
      <div className="dashboard-layout variant-c">
        <div className="dashboard no-sidebar">
          <div className="dashboard-content">
            <BusinessImpactCard />
            <DemoSection variant={variant} />
          </div>
        </div>
      </div>
    );
  }

  // Variant D: same organization as default/variant a (sidebar + content) but with Flow | Network toggle
  if (variant === 'd') {
    return (
      <div className="dashboard-layout variant-d">
        <Sidebar />
        <div className="dashboard">
          <div className="dashboard-content">
            <BusinessImpactCard />
            <DemoSection variant={variant} />
          </div>
        </div>
      </div>
    );
  }

  // Default / Variant A
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard">
        <div className="dashboard-content">
          <BusinessImpactCard />
          <DemoSection variant={variant} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard