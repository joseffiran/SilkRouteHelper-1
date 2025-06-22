import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginRequest } from "@shared/schema";

export default function LoginForm() {
  const { login, loginLoading, loginError } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data);
      toast({
        title: "Login successful",
        description: "Welcome back to SilkRoute OS!",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: loginError?.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Sign in to your SilkRoute OS account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </Label>
          <div className="relative">
            <Input
              {...register("email")}
              type="email"
              id="email"
              placeholder="Enter your email"
              className="pl-12"
            />
            <i className="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </Label>
          <div className="relative">
            <Input
              {...register("password")}
              type="password"
              id="password"
              placeholder="Enter your password"
              className="pl-12"
            />
            <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="text-sm text-gray-600">
              Remember me
            </Label>
          </div>
          <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          disabled={loginLoading}
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
        >
          {loginLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing In...
            </div>
          ) : (
            <>
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
