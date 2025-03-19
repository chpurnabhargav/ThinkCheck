import MCQModePage from "./MCQModePage"; // Case-sensitive!
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
 // Import from components folder

export default function MCQPage() {
  return(
    <ClerkProvider>
  <MCQModePage />
</ClerkProvider>
  );
}


