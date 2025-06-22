import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger 
              value="login" 
              className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="rounded-none data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="p-8 m-0">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="signup" className="p-8 m-0">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
