import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import HomePage from './Home';

export default function Index() {
  return (
    <ClerkProvider>
      <HomePage />
    </ClerkProvider>
  );
}