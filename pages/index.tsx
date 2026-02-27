import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export async function getServerSideProps() {
  return { props: {} };
}

export default function HomePage() {
  const user = useUser({ or: 'return-null' });
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;
    if (user) router.replace('/panel');
    else router.replace('/handler/signin');
  }, [user, router]);

  return (
    <div style={{ fontFamily: 'system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p>Redirecting…</p>
    </div>
  );
}
