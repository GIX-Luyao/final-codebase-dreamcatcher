import Dashboard from './components/Dashboard';
import { TelemetryProvider } from '../../shared/context/TelemetryContext';
import '../../shared/styles/index.css';

function BusinessApp() {
  return (
    <TelemetryProvider>
      <Dashboard />
    </TelemetryProvider>
  );
}

export default BusinessApp;