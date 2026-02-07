import RealTimeDashboard from '../../components/RealTimeDashboard';

// Enable ISR with 30-second revalidation to reduce server-side rendering costs
export const revalidate = 30;

export default function DashboardPage() {
  return <RealTimeDashboard />;
}

export const metadata = {
  title: 'Real-Time Protocol Monitor - Solana DevEx Platform',
  description: 'Live monitoring dashboard for Solana network and DeFi protocol health tracking',
};