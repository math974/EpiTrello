import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bienvenue"
      subtitle="Connectez-vous pour acceder a votre espace"
    >
      <LoginForm />
    </AuthLayout>
  );
}
