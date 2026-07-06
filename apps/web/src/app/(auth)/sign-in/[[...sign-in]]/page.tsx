import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1220] p-4">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#3B82F6',
          },
        }}
      />
    </div>
  );
}
