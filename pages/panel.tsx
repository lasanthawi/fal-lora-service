import { useEffect, useState } from 'react';
import PanelView from '../components/PanelView';

export async function getServerSideProps() {
  return { props: {} };
}

export default function PanelPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="loading-screen">
        <span className="loading-dots">Loading</span>
      </div>
    );
  }

  return <PanelView />;
}
