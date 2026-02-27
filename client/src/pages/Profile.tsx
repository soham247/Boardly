import { useState, useRef } from 'react';
import { useAuthStore } from '../store/auth-store';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PencilLine, Camera, Verified, LockKeyhole, UserRound } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback to username generator if full name is missing
  const displayName = user?.fullName || user?.username || 'User';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (fullName !== user?.fullName) formData.append('fullName', fullName);
      if (profession !== user?.profession) formData.append('profession', profession);
      if (selectedFile) formData.append('avatar', selectedFile);

      // Only make request if there are changes
      let changed = false;
      for (const _ of formData.entries()) {
        changed = true; // iterator isn't empty
        break;
      }

      if (changed) {
        await updateProfile(formData);
        toast.success('Profile updated successfully');
      } else {
        toast.info('No changes made');
      }
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFullName(user?.fullName || '');
    setProfession(user?.profession || '');
    setAvatarPreview(user?.avatar || '');
    setSelectedFile(null);
  };

  return (
    <div className="container max-w-4xl py-10 px-4 mx-auto">
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-card">
        <CardHeader className="p-8 pb-4 border-b">
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
              {/* Avatar Section */}
              <div className="relative group">
                <div
                  className={`relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-4 bg-muted
                    ${user?.tier === 'Premium' ? 'border-amber-400' : 'border-background'}`}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold uppercase">
                      {displayName.charAt(0)}
                    </div>
                  )}

                  {isEditing && (
                    <div
                      className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium">Change</span>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-md hover:bg-primary/90 transition-colors"
                  >
                    <PencilLine className="w-4 h-4" />
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Name Details */}
              <div className="flex-1 text-center sm:text-left space-y-4 w-full">
                {isEditing ? (
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="fullName"
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        FULL NAME
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="username"
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        USERNAME
                      </Label>
                      <Input
                        id="username"
                        value={`@${user?.username}`}
                        disabled
                        className="h-11 bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {user?.fullName || 'No Name Set'}
                    </h1>
                    <p className="text-lg text-muted-foreground mt-1">@{user?.username}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto self-start sm:self-center mt-4 sm:mt-0">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-11 px-6 font-medium"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={saving}
                    variant="outline"
                    className="w-full sm:w-auto h-11 px-6 font-medium"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-primary hover:bg-primary/90 hidden sm:flex h-11 px-6 font-medium gap-2"
                >
                  <PencilLine className="w-4 h-4" /> Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="flex items-center gap-2 mb-8">
            <UserRound className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Account Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-4 items-center">
            {/* Email */}
            <div className="text-sm font-medium text-muted-foreground">Email Address</div>
            <div className="md:col-span-2">
              {isEditing ? (
                <div className="relative max-w-xl">
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="h-11 bg-muted/50 pr-10 cursor-not-allowed"
                  />
                  <LockKeyhole className="absolute right-3 top-3 w-5 h-5 text-muted-foreground/50" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-base text-foreground font-medium">{user?.email}</span>
                  <LockKeyhole className="w-4 h-4 text-muted-foreground/50" />
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-3 h-px bg-border/50 hidden md:block" />

            {/* Profession */}
            <div className="text-sm font-medium text-muted-foreground">Profession</div>
            <div className="md:col-span-2">
              {isEditing ? (
                <Input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Senior Developer"
                  className="h-11 max-w-xl"
                />
              ) : (
                <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium">
                  {user?.profession || 'Not set'}
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-3 h-px bg-border/50 hidden md:block" />

            {/* Tier Status */}
            <div className="text-sm font-medium text-muted-foreground">Tier Status</div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Verified className="w-5 h-5 text-amber-500" />
                <span className="text-base font-semibold text-foreground">
                  {user?.tier || 'Free'}
                </span>
                {user?.tier === 'Premium' && (
                  <span className="text-sm text-muted-foreground ml-1">(Billed annually)</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <div className="bg-muted/30 border-t p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Member since{' '}
            {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}{' '}
            • Last profile update:{' '}
            {new Date(user?.updatedAt || Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </Card>
    </div>
  );
}
