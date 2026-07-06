import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#0ea5e9',
          },
        }}
      />
    </div>
  );
}
