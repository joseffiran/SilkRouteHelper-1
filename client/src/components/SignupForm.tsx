import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { z } from "zod";

interface SignupFormData extends InsertUser {
  confirmPassword: string;
  agreeToTerms: boolean;
}

const signupFormSchema = insertUserSchema.extend({
  confirmPassword: insertUserSchema.shape.password,
  agreeToTerms: z.union([z.boolean(), z.string()]).transform((val) => val === true || val === "true"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.agreeToTerms, {
  message: "You must agree to the terms of service",
  path: ["agreeToTerms"],
});

export default function SignupForm() {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/v1/users/", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account created successfully",
        description: "You can now sign in with your credentials.",
      });
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      const { confirmPassword, agreeToTerms, ...userData } = data;
      await signupMutation.mutateAsync(userData);
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-600">Join SilkRoute OS to streamline your customs declarations</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </Label>
          <div className="relative">
            <Input
              {...register("companyName")}
              type="text"
              id="company-name"
              placeholder="Enter your company name"
              className="pl-12"
            />
            <i className="fas fa-building absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </Label>
          <div className="relative">
            <Input
              {...register("email")}
              type="email"
              id="signup-email"
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
          <Label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </Label>
          <div className="relative">
            <Input
              {...register("password")}
              type="password"
              id="signup-password"
              placeholder="Create a strong password"
              className="pl-12"
            />
            <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          <p className="mt-2 text-xs text-gray-500">Password must be at least 8 characters long</p>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              {...register("confirmPassword")}
              type="password"
              id="confirm-password"
              placeholder="Confirm your password"
              className="pl-12"
            />
            <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            {...register("agreeToTerms")}
            id="agreeToTerms"
            className="mt-1"
          />
          <label htmlFor="agreeToTerms" className="text-sm text-gray-600">
            I agree to the{" "}
            <a href="#" className="text-primary hover:text-primary/80">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:text-primary/80">
              Privacy Policy
            </a>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
        )}

        <Button
          type="submit"
          disabled={signupMutation.isPending}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
        >
          {signupMutation.isPending ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Account...
            </div>
          ) : (
            <>
              <i className="fas fa-user-plus mr-2"></i>
              Create Account
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
