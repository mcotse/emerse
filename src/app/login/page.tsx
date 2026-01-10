import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold">Emerse</h1>
        <LoginForm />
        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          Demo: demo@emerse.app / demo
        </p>
      </div>
    </div>
  );
}
