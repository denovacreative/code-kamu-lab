import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
  Camera,
  GraduationCap,
  BookOpen,
  Activity,
  Users,
  Trophy
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface ProfileStats {
  classes_joined?: number;
  classes_created?: number;
  assignments_completed?: number;
  assignments_created?: number;
  total_executions?: number;
  last_activity?: string;
}

interface ProfileManagementProps {
  onBack?: () => void;
}

const ProfileManagement = ({ onBack }: ProfileManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || '',
          avatar_url: data.avatar_url || ''
        });
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user?.id,
            display_name: user?.email?.split('@')[0] || 'User',
            role: 'student'
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        setFormData({
          display_name: newProfile.display_name || '',
          avatar_url: newProfile.avatar_url || ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const userStats: ProfileStats = {};

      // Get classes stats based on role
      if (profile?.role === 'teacher') {
        // Classes created by teacher
        const { data: classesData } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', user?.id);
        
        userStats.classes_created = classesData?.length || 0;

        // Assignments created
        const { data: assignmentsData } = await supabase
          .from('notebook_assignments')
          .select('id')
          .eq('teacher_id', user?.id);
        
        userStats.assignments_created = assignmentsData?.length || 0;
      } else {
        // Classes joined by student
        const { data: classMembersData } = await supabase
          .from('class_members')
          .select('id')
          .eq('student_id', user?.id)
          .eq('is_active', true);
        
        userStats.classes_joined = classMembersData?.length || 0;

        // Assignments completed
        const { data: assignmentsData } = await supabase
          .from('notebook_assignments')
          .select('id')
          .eq('student_id', user?.id)
          .eq('status', 'submitted');
        
        userStats.assignments_completed = assignmentsData?.length || 0;
      }

      // Total code executions
      const { data: activitiesData } = await supabase
        .from('class_activities')
        .select('id')
        .eq('user_id', user?.id)
        .eq('activity_type', 'cell_execute');
      
      userStats.total_executions = activitiesData?.length || 0;

      // Last activity
      const { data: lastActivityData } = await supabase
        .from('class_activities')
        .select('timestamp')
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (lastActivityData) {
        userStats.last_activity = lastActivityData.timestamp;
      }

      setStats(userStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile({
        ...profile,
        display_name: formData.display_name,
        avatar_url: formData.avatar_url
      });

      setEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))] flex items-center justify-center">
        <div className="text-white text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pictoblox-purple))] to-[hsl(var(--pictoblox-purple-dark))]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={onBack}
              >
                ← Back
              </Button>
            )}
            <h1 className="text-xl font-bold text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Management
            </h1>
          </div>
          
          <Badge variant="outline" className="text-white border-white/30 capitalize">
            {profile?.role || 'Student'}
          </Badge>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <Button
                onClick={() => {
                  if (editing) {
                    saveProfile();
                  } else {
                    setEditing(true);
                  }
                }}
                size="sm"
                className={editing ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {editing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {formData.display_name?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {editing && (
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Profile Form */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Display Name</Label>
                    {editing ? (
                      <Input
                        value={formData.display_name}
                        onChange={(e) => setFormData({
                          ...formData,
                          display_name: e.target.value
                        })}
                        placeholder="Enter your display name"
                      />
                    ) : (
                      <p className="text-lg font-medium">
                        {profile?.display_name || 'Not set'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Email</Label>
                    <p className="text-lg text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {user?.email}
                    </p>
                  </div>
                </div>

                {editing && (
                  <div>
                    <Label>Avatar URL</Label>
                    <Input
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({
                        ...formData,
                        avatar_url: e.target.value
                      })}
                      placeholder="Enter avatar image URL"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Role</Label>
                    <p className="text-lg capitalize flex items-center">
                      {profile?.role === 'teacher' ? (
                        <GraduationCap className="h-4 w-4 mr-2" />
                      ) : (
                        <BookOpen className="h-4 w-4 mr-2" />
                      )}
                      {profile?.role || 'Student'}
                    </p>
                  </div>
                  
                  <div>
                    <Label>Member Since</Label>
                    <p className="text-lg text-gray-600 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Activity Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile?.role === 'teacher' ? (
                <>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.classes_created || 0}
                    </div>
                    <div className="text-sm text-gray-600">Classes Created</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.assignments_created || 0}
                    </div>
                    <div className="text-sm text-gray-600">Assignments Created</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.classes_joined || 0}
                    </div>
                    <div className="text-sm text-gray-600">Classes Joined</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.assignments_completed || 0}
                    </div>
                    <div className="text-sm text-gray-600">Assignments Completed</div>
                  </div>
                </>
              )}
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.total_executions || 0}
                </div>
                <div className="text-sm text-gray-600">Code Executions</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.last_activity ? formatTimeAgo(stats.last_activity) : 'Never'}
                </div>
                <div className="text-sm text-gray-600">Last Activity</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive notifications about class activities and assignments</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Email Notifications",
                    description: "Email notification settings will be saved automatically"
                  });
                }}
              >
                Configure
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Privacy Settings</h4>
                <p className="text-sm text-gray-600">Control who can see your profile information</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Privacy Settings",
                    description: "Your profile is visible to class members only"
                  });
                }}
              >
                Manage
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Change Password</h4>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(
                      user?.email || '',
                      { redirectTo: `${window.location.origin}/auth` }
                    );
                    
                    if (error) throw error;
                    
                    toast({
                      title: "Password Reset",
                      description: "Password reset link sent to your email"
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to send password reset email",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Reset Password
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-600">Delete Account</h4>
                <p className="text-sm text-gray-600">Permanently delete your account and all associated data</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Account Deletion",
                    description: "Please contact support to delete your account",
                    variant: "destructive"
                  });
                }}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileManagement;