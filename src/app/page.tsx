import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function Home() {
    const session = await auth();
    if (session?.user) {
        redirect('/dashboard');
    }
    // Pre-Task 5 placeholder: until the landing page lands, send unauth users
    // straight to the NextAuth-built sign-in screen.
    redirect('/api/auth/signin');
}
