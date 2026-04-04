import React, { useState, useEffect } from 'react';
import { User, Shield, Save } from 'lucide-react';
import { BentoBox } from '../components/BentoBox';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../lib/api';

export function Settings() {
  const { user, login } = useAuth(); // assuming login context update available if needed, usually auth context refetches on mutate or we trigger a page reload

  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');
    try {
      await fetchApi('/profile', {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
      setProfileMessage('Profile updated successfully!');
      // Force a tiny visual success delay
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err: any) {
      setProfileMessage(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage('All password fields are required.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    setPasswordMessage('');
    try {
      await fetchApi('/me', {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      setPasswordMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (err: any) {
      setPasswordMessage(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Settings</h1>
        <p className="text-muted mt-1">Manage your account settings and security preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BentoBox span={2} className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-surface-hover rounded-lg border border-border-subtle">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-primary">My Profile</h3>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/50 border border-border-subtle rounded-xl text-primary focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Email Address</label>
              <input 
                type="email" 
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 bg-black/20 border border-border-subtle rounded-xl text-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted mt-1">Email changes are restricted at the system level.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Role</label>
              <input 
                type="text" 
                value={user?.role || ''}
                disabled
                className="w-full px-4 py-2.5 bg-black/20 border border-border-subtle rounded-xl text-muted cursor-not-allowed"
              />
            </div>
            {profileMessage && <p className="text-sm text-primary">{profileMessage}</p>}
            <div className="pt-4">
              <button disabled={savingProfile || !name} type="submit" className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50 w-full sm:w-auto">
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </BentoBox>

        <BentoBox span={2} className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-surface-hover rounded-lg border border-border-subtle">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-primary">Security</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <p className="text-sm text-muted mb-2">
              Update your password to keep your account secure.
            </p>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Current Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Verify current password"
                className="w-full px-4 py-2.5 bg-black/50 border border-border-subtle rounded-xl text-primary focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted mb-1">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-4 py-2.5 bg-black/50 border border-border-subtle rounded-xl text-primary focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Repeat New Password</label>
              <input 
                type="password" 
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 bg-black/50 border border-border-subtle rounded-xl text-primary focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong transition-colors shadow-inner"
              />
            </div>

            {passwordMessage && <p className={`text-sm ${passwordMessage.includes('required') || passwordMessage.includes('Failed') || passwordMessage.includes('incorrect') || passwordMessage.includes('do not match') || passwordMessage.includes('must be at least') ? 'text-red-400' : 'text-success'}`}>{passwordMessage}</p>}
            
            <div className="pt-4">
              <button disabled={savingPassword || !currentPassword || !newPassword || !confirmNewPassword} type="submit" className="w-full py-2.5 px-4 border border-border-strong rounded-xl text-sm font-medium hover:bg-surface transition-colors disabled:opacity-50">
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </BentoBox>
      </div>
    </div>
  );
}
