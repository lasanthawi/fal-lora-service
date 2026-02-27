import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export async function getServerSideProps() {
  return { props: {} };
}

/** Only rendered after mount so useUser never runs during SSR. */
function HomeRedirect() {
  const user = useUser({ or: 'return-null' });
  const router = useRouter();
  useEffect(() => {
    if (user === undefined) return;
    if (user) router.replace('/panel');
    else router.replace('/handler/signin');
  }, [user, router]);
  return (
    <div className="loading-screen">
      <span className="loading-dots">Redirecting</span>
    </div>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="loading-screen">
        <span className="loading-dots">Loading</span>
      </div>
    );
  }

  return <HomeRedirect />;
}
