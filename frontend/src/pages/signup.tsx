import AuthLayout from '../components/auth/AuthLayout';
import SignupForm from '../components/auth/SignupForm';

export default function SignupPage() {
  return (
    <AuthLayout
      title="Creer un compte"
      subtitle="Rejoignez EpiTrello en quelques secondes"
    >
      <SignupForm />
    </AuthLayout>
  );
}
