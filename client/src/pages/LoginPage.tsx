import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import AuthTabs from "@/components/AuthTabs";

export default function LoginPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-shipping-fast text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SilkRoute OS</h1>
                <p className="text-xs text-gray-500">Declaration Helper</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AuthTabs />

          {/* Additional Information */}
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg p-6 shadow-sm max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Why Choose SilkRoute OS?</h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex flex-col items-center p-4">
                  <i className="fas fa-robot text-primary text-2xl mb-2"></i>
                  <span className="font-medium text-gray-900">AI-Powered OCR</span>
                  <span className="text-gray-600 text-center">Automated document processing</span>
                </div>
                <div className="flex flex-col items-center p-4">
                  <i className="fas fa-clock text-primary text-2xl mb-2"></i>
                  <span className="font-medium text-gray-900">Save Time</span>
                  <span className="text-gray-600 text-center">Reduce declaration time by 80%</span>
                </div>
                <div className="flex flex-col items-center p-4">
                  <i className="fas fa-shield-alt text-primary text-2xl mb-2"></i>
                  <span className="font-medium text-gray-900">Compliance</span>
                  <span className="text-gray-600 text-center">Always up-to-date with regulations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <i className="fas fa-shipping-fast text-white text-xs"></i>
              </div>
              <span className="text-gray-600 text-sm">© 2024 SilkRoute OS. All rights reserved.</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
