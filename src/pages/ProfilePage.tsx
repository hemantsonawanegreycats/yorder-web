import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';
import { useAddressesQuery, useDeleteAddressMutation } from '../api/address.api';
import { useOrdersQuery } from '../api/orders.api';
import { apiClient } from '../api/client';
import { rupee } from '../utils/formatters';
import { SEO } from '../components/common/SEO';
import { Skeleton, BagItemSkeleton, ErrorState } from '../components/common/Skeleton';
import {
  User,
  MapPin,
  Package,
  Settings,
  Plus,
  Trash2,
  LogOut,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, fetchProfile, setAuthModalOpen } = useAuthStore();
  const { showToast, go, setAddressModalOpen } = useAppStore();

  const [activeTab, setActiveTab] = useState<'addresses' | 'orders' | 'profile'>('addresses');

  // Queries
  const { data: addresses, isLoading: addrLoading } = useAddressesQuery();
  const { data: orders, isLoading: ordersLoading } = useOrdersQuery();
  const deleteAddressMutation = useDeleteAddressMutation();

  // Profile Edit fields
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast('Please enter a valid email address');
      return;
    }

    try {
      setSavingProfile(true);
      await apiClient.post('/user/profile/update', {
        first_name: firstName.trim().slice(0, 50),
        last_name: lastName.trim().slice(0, 50),
        email: email.trim().slice(0, 80),
      });
      await fetchProfile();
      showToast('Profile updated successfully');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAddress = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this delivery address?')) {
      return;
    }
    deleteAddressMutation.mutate(id, {
      onSuccess: () => showToast('Address deleted'),
    });
  };

  const handleLogout = async () => {
    await logout();
    showToast('Signed out of session');
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6 text-center">
        <SEO title="User Profile — Yorder" description="Sign in to view your Yorder profile, addresses, and door trials." canonical="https://yorder.com/profile" />
        <div className="w-full max-w-md p-8 rounded-[24px] bg-[var(--s0)] border border-[var(--bd)] flex flex-col items-center gap-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center text-xl font-bold text-[var(--gold)]">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-semibold text-2xl text-[var(--t1)]">Member Profile</h1>
            <p className="text-xs text-[var(--t3)] mt-2 leading-relaxed">
              Sign in with your mobile number to view saved delivery addresses, door trial orders, and account settings.
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full h-11 rounded-full bg-[var(--acc)] text-[var(--on-acc)] font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 shadow-md"
          >
            Log in with Mobile Number <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8 min-h-[calc(100vh-140px)]">
      <SEO title="User Profile & Settings — Yorder" description="Manage your Yorder profile, saved delivery addresses, and door trials." canonical="https://yorder.com/profile" />

      {/* Top Profile Card */}
      <div className="p-6 md:p-8 rounded-[24px] bg-[var(--s0)] border border-[var(--bd)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center text-2xl font-bold text-[var(--gold)] flex-shrink-0">
            {user?.first_name ? user.first_name[0].toUpperCase() : 'YO'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-2xl text-[var(--t1)]">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Yorder Member'}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ok)] font-medium px-2 py-0.5 rounded-full bg-[var(--ok)]/10 border border-[var(--ok)]/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--t3)] font-mono mt-1.5">
              <span>{user?.phone || 'Phone Verified'}</span>
              {user?.email && (
                <>
                  <span>·</span>
                  <span>{user.email}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-[var(--bd)] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('addresses')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all"
          style={{
            background: activeTab === 'addresses' ? 'var(--acc)' : 'transparent',
            color: activeTab === 'addresses' ? 'var(--on-acc)' : 'var(--t2)',
            border: activeTab === 'addresses' ? 'none' : '1px solid var(--bd)',
          }}
        >
          <MapPin className="w-3.5 h-3.5" />
          Delivery Addresses ({addresses?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all"
          style={{
            background: activeTab === 'orders' ? 'var(--acc)' : 'transparent',
            color: activeTab === 'orders' ? 'var(--on-acc)' : 'var(--t2)',
            border: activeTab === 'orders' ? 'none' : '1px solid var(--bd)',
          }}
        >
          <Package className="w-3.5 h-3.5" />
          Orders & Door Trials ({orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all"
          style={{
            background: activeTab === 'profile' ? 'var(--acc)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--on-acc)' : 'var(--t2)',
            border: activeTab === 'profile' ? 'none' : '1px solid var(--bd)',
          }}
        >
          <Settings className="w-3.5 h-3.5" />
          Profile Settings
        </button>
      </div>

      {/* Tab 1: Addresses */}
      {activeTab === 'addresses' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg text-[var(--t1)]">Saved Delivery Addresses</h2>
              <p className="text-xs text-[var(--t3)] mt-1">
                Addresses used by showroom riders for 10-minute doorstep trials.
              </p>
            </div>
            <button
              onClick={() => setAddressModalOpen(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Address with Map
            </button>
          </div>

          {addrLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="w-full h-36 rounded-[18px]" />
              <Skeleton className="w-full h-36 rounded-[18px]" />
            </div>
          ) : addresses && addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-5 rounded-[18px] bg-[var(--s0)] border border-[var(--bd)] flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase font-semibold text-[var(--gold)]">
                        {addr.type?.name || 'Home'}
                      </span>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1 text-[var(--t3)] hover:text-red-400 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="font-medium text-sm text-[var(--t1)] mt-2">
                      {addr.address1 || addr.formated_address}
                    </div>
                    {addr.address2 && <div className="text-xs text-[var(--t2)] mt-0.5">{addr.address2}</div>}
                    <div className="text-xs text-[var(--t3)] mt-1.5">
                      {addr.city}, {addr.state} {addr.postalCode}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[var(--bd)] text-[10.5px] text-[var(--t4)] font-mono">
                    ID #{addr.id} · Verified Geolocation
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-[20px] bg-[var(--s1)] border border-[var(--bd)] text-center flex flex-col items-center gap-3">
              <MapPin className="w-8 h-8 text-[var(--t4)]" />
              <div className="font-semibold text-sm text-[var(--t1)]">No addresses saved yet</div>
              <p className="text-xs text-[var(--t3)] max-w-xs">
                Add your home or office address to enable instant doorstep trials from nearby showrooms.
              </p>
              <button
                onClick={() => setAddressModalOpen(true)}
                className="mt-2 h-9 px-5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold"
              >
                Add Your First Address
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-semibold text-lg text-[var(--t1)]">Order History & Live Door Trials</h2>
            <p className="text-xs text-[var(--t3)] mt-1">
              Real orders placed with showroom floors and live delivery status.
            </p>
          </div>

          {ordersLoading ? (
            <div className="flex flex-col gap-4">
              <BagItemSkeleton />
              <BagItemSkeleton />
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="flex flex-col gap-4">
              {orders.map((ord: any) => (
                <div
                  key={ord.id}
                  onClick={() => navigate(`/order?order_id=${ord.id}`)}
                  className="p-5 rounded-[18px] bg-[var(--s0)] border border-[var(--bd)] hover:border-[var(--gold)] cursor-pointer transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-[var(--gold)]">
                        ORDER #{ord.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ok)]/10 text-[var(--ok)] font-medium">
                        {ord.status || 'PROCESSING'}
                      </span>
                    </div>
                    <div className="font-medium text-sm text-[var(--t1)] mt-2 group-hover:text-[var(--gold)] transition-colors">
                      {ord.items?.length || 1} Item(s) from showroom
                    </div>
                    <div className="text-xs text-[var(--t3)] mt-1 font-mono">
                      {new Date(ord.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Payment: {ord.payment_method || 'Pay on Keep'}
                    </div>
                  </div>
                  <div className="flex items-baseline md:items-end flex-col gap-2">
                    <span className="font-semibold text-base text-[var(--t1)]">
                      {rupee(ord.total || ord.amount || 0)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/order?order_id=${ord.id}`);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-[10.5px] font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                      Track Order ›
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-[20px] bg-[var(--s1)] border border-[var(--bd)] text-center flex flex-col items-center gap-3">
              <Package className="w-8 h-8 text-[var(--t4)]" />
              <div className="font-semibold text-sm text-[var(--t1)]">No orders placed yet</div>
              <p className="text-xs text-[var(--t3)] max-w-xs">
                Add an item from a nearby showroom to your bag and start a 10-minute doorstep trial.
              </p>
              <button
                onClick={() => go('products')}
                className="mt-2 h-9 px-5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold"
              >
                Browse Nearby Shelves
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Profile Settings Form */}
      {activeTab === 'profile' && (
        <div className="p-6 md:p-8 rounded-[24px] bg-[var(--s0)] border border-[var(--bd)] max-w-xl">
          <h2 className="font-semibold text-lg text-[var(--t1)] mb-4">Edit Profile Settings</h2>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-[var(--t3)] uppercase mb-1.5">First Name</label>
                <input
                  type="text"
                  maxLength={50}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)] text-xs text-[var(--t1)] outline-none focus:border-[var(--gold)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-[var(--t3)] uppercase mb-1.5">Last Name</label>
                <input
                  type="text"
                  maxLength={50}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)] text-xs text-[var(--t1)] outline-none focus:border-[var(--gold)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--t3)] uppercase mb-1.5">Email Address</label>
              <input
                type="email"
                maxLength={80}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)] text-xs text-[var(--t1)] outline-none focus:border-[var(--gold)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--t3)] uppercase mb-1.5">Phone (Verified)</label>
              <input
                type="text"
                disabled
                value={user?.phone || 'Verified by OTP'}
                className="w-full h-11 px-3.5 rounded-[12px] bg-[var(--s1)] border border-[var(--bd)] text-xs text-[var(--t3)] outline-none opacity-70 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="mt-2 h-11 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold hover:opacity-90 transition-all self-start px-6"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
