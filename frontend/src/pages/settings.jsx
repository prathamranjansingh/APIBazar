import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Shield, Key } from "lucide-react";

const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  company: "Acme Inc",
  jobTitle: "Developer",
};

const UserSettings = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    company: "",
    jobTitle: "",
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    apiUsageAlerts: true,
    marketingEmails: false,
    webhookFailures: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setProfile({
        name: mockUser.name,
        email: mockUser.email,
        company: mockUser.company,
        jobTitle: mockUser.jobTitle,
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Profile updated successfully");
      setSaving(false);
    } catch (error) {
      toast.error("Failed to update profile");
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Notification preferences updated");
      setSaving(false);
    } catch (error) {
      toast.error("Failed to update notification preferences");
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96">Loading settings...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={profile.company}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={profile.jobTitle}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={() => handleNotificationChange("emailNotifications")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">API Usage Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you approach usage limits
                  </p>
                </div>
                <Switch
                  checked={notifications.apiUsageAlerts}
                  onCheckedChange={() => handleNotificationChange("apiUsageAlerts")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Marketing Communications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and offers
                  </p>
                </div>
                <Switch
                  checked={notifications.marketingEmails}
                  onCheckedChange={() => handleNotificationChange("marketingEmails")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Webhook Failure Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when webhooks fail to deliver
                  </p>
                </div>
                <Switch
                  checked={notifications.webhookFailures}
                  onCheckedChange={() => handleNotificationChange("webhookFailures")}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveNotifications} disabled={saving}>
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => toast.info("2FA setup would start here")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Enable
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Change Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Update your password regularly for better security
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => toast.info("Password change would start here")}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Update
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">API Keys</Label>
                    <p className="text-sm text-muted-foreground">
                      Manage your API keys and access tokens
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => toast.info("API key management would open here")}
                  >
                    Manage Keys
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettings;