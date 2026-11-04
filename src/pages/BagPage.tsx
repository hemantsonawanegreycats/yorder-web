import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useProductsQuery, fetchProductById } from '../api/products.api';
import { useVendorsQuery } from '../api/vendors.api';
import { useAddressesQuery, useCreateAddressMutation, CreateAddressPayload } from '../api/address.api';
import { useValidateCouponMutation } from '../api/coupons.api';
import { useCreateOrderFromCartMutation } from '../api/orders.api';
import { useCreateRazorpayOrderMutation, useVerifyRazorpayPaymentMutation } from '../api/razorpay.api';
import { openRazorpayCheckout } from '../utils/razorpay';
import { useChatStore } from '../stores/useChatStore';
import { AddressMapModal } from '../components/address/AddressMapModal';
import { rupee } from '../utils/formatters';
import { SEO } from '../components/common/SEO';
import { BagItemSkeleton, Skeleton } from '../components/common/Skeleton';

export const BagPage: React.FC = () => {
  const navigate = useNavigate();
  const { go, setPid, showToast } = useAppStore();
  const { user, isAuthenticated, setAuthModalOpen } = useAuthStore();
  const {
    bag,
    cartId,
    updateQuantity,
    removeAt,
    clearBag,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    selectedAddressId,
    setSelectedAddressId,
    syncBackendCart,
  } = useCartStore();

  const [isInitialSyncing, setIsInitialSyncing] = useState(true);

  const { data: allProducts } = useProductsQuery();
  const { data: stores } = useVendorsQuery();
  const { data: addresses, isLoading: addressesLoading } = useAddressesQuery();
  const { setActiveChatId } = useChatStore();

  const validateCouponMutation = useValidateCouponMutation();
  const createOrderMutation = useCreateOrderFromCartMutation();
  const createAddressMutation = useCreateAddressMutation();
  const createRazorpayOrderMutation = useCreateRazorpayOrderMutation();
  const verifyRazorpayMutation = useVerifyRazorpayPaymentMutation();

  const [couponInput, setCouponInput] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Address creation form state
  const [addrForm, setAddrForm] = useState<CreateAddressPayload>({
    addressLine1: '',
    addressLine2: '',
    nearBy: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '',
    type: 'user_home',
  });

  // Ensure backend cart is synced on mount with graceful skeleton
  useEffect(() => {
    syncBackendCart().finally(() => setIsInitialSyncing(false));
  }, [syncBackendCart]);

  // If any bag items don't have product details populated, fetch them directly by ID
  useEffect(() => {
    const missingPids = bag.filter((b) => !b.product && b.pid).map((b) => b.pid);
    if (missingPids.length > 0) {
      Promise.all(missingPids.map((id) => fetchProductById(id))).then((fetched) => {
        useCartStore.setState((state) => ({
          bag: state.bag.map((b) => {
            if (b.product) return b;
            const match = fetched.find((p) => p && String(p.id) === String(b.pid));
            return match ? { ...b, product: match } : b;
          }),
        }));
      });
    }
  }, [bag]);

  // Set default address if not selected
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses, selectedAddressId, setSelectedAddressId]);

  const totalQuantity = bag.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const hasItems = bag.length > 0;

  const resolvedBagItems = bag.map((b, i) => {
    const product = b.product || (allProducts || []).find((p) => String(p.id) === String(b.pid));
    return {
      bagIndex: i,
      pid: b.pid,
      size: b.size,
      quantity: b.quantity || 1,
      cartItemId: b.cartItemId,
      product: product || null,
      isResolving: !product,
    };
  });

  // Group items by showroom
  const groupedByStore = resolvedBagItems.reduce<Record<string, typeof resolvedBagItems>>((acc, item) => {
    const sid = String(item.product?.sid || '1');
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(item);
    return acc;
  }, {});

  const subtotal = resolvedBagItems.reduce((acc, it) => acc + (it.product?.price || 0) * it.quantity, 0);
  const deliveryFee = hasItems ? Object.keys(groupedByStore).length * 10 : 0;
  const couponDiscount = appliedCoupon?.discount || 0;
  const totalPayable = Math.max(0, subtotal + deliveryFee - couponDiscount);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId) || addresses?.[0];

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const resp = await validateCouponMutation.mutateAsync({
        code: couponInput.trim().toUpperCase(),
        cartAmount: subtotal,
      });
      if (resp?.status && resp?.data?.valid) {
        applyCoupon({
          code: resp.data.couponCode,
          discount: resp.data.discount || 50,
          vendorId: resp.data.vendorId,
        });
        setCouponInput('');
      } else {
        showToast(resp?.message || 'Invalid coupon code');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Coupon validation failed');
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.addressLine1.trim() || !addrForm.zipCode.trim()) {
      showToast('Street address and 6-digit Pincode are required');
      return;
    }
    try {
      const resp = await createAddressMutation.mutateAsync(addrForm);
      if (resp?.status && resp?.data) {
        setSelectedAddressId(resp.data.id);
        setShowAddressModal(false);
        showToast('Delivery address saved successfully');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save address');
    }
  };

  const handleProceedToOrder = async () => {
    if (!hasItems) return;

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      showToast('Please log in with mobile OTP to complete your order');
      return;
    }

    const userAddress = addresses?.find((a) => a.id === selectedAddressId) || addresses?.[0];
    if (!userAddress?.id) {
      setShowAddressModal(true);
      showToast('Please add or select a delivery address to proceed');
      return;
    }

    const effectiveAddressId = userAddress.id;
    let targetCartId = cartId;

    setIsSubmittingOrder(true);
    try {
      if (!targetCartId) {
        const synced = await syncBackendCart();
        targetCartId = synced?.id || null;
      }

      if (!targetCartId) {
        showToast('Cart initialization failed. Please try again.');
        setIsSubmittingOrder(false);
        return;
      }

      // Online Razorpay Flow
      if (paymentMethod === 'razorpay') {
        if (totalPayable <= 0) {
          showToast('Payable amount must be greater than zero');
          setIsSubmittingOrder(false);
          return;
        }

        // 1. Create order on Razorpay via backend
        const rzpOrderResp = await createRazorpayOrderMutation.mutateAsync(Math.round(totalPayable));
        if (!rzpOrderResp?.status || !rzpOrderResp?.data?.id) {
          showToast(rzpOrderResp?.message || 'Failed to initialize Razorpay order');
          setIsSubmittingOrder(false);
          return;
        }

        const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
        const prefill = {
          name: fullName || undefined,
          email: user?.email || undefined,
          contact: user?.phone ? user.phone.slice(-10) : undefined,
        };

        // 2. Open official Razorpay Checkout web modal
        const checkoutResult = await openRazorpayCheckout({
          orderId: rzpOrderResp.data.id,
          amount: rzpOrderResp.data.amount,
          currency: rzpOrderResp.data.currency,
          prefill,
          notes: rzpOrderResp.data.notes,
        });

        if (!checkoutResult.success || !checkoutResult.data) {
          showToast(checkoutResult.error || 'Payment was cancelled');
          setIsSubmittingOrder(false);
          return;
        }

        // 3. Verify Razorpay payment signature on backend
        const verifyResp = await verifyRazorpayMutation.mutateAsync({
          razorpay_order_id: checkoutResult.data.razorpay_order_id,
          razorpay_payment_id: checkoutResult.data.razorpay_payment_id,
          razorpay_signature: checkoutResult.data.razorpay_signature,
          amount: rzpOrderResp.data.amount,
        });

        if (!verifyResp?.status) {
          showToast(verifyResp?.message || 'Payment verification failed');
          setIsSubmittingOrder(false);
          return;
        }

        // 4. Place order with transaction_id and isPaid: true
        const orderResult = await createOrderMutation.mutateAsync({
          cart_id: targetCartId,
          payment_method: 'razorpay',
          delivery_address_id: effectiveAddressId,
          billing_address_id: effectiveAddressId,
          isPaid: true,
          transaction_id: verifyResp.data?.id,
          coupons: appliedCoupon ? { [appliedCoupon.vendorId || 0]: appliedCoupon.code } : undefined,
        });

        const placedOrderId = orderResult?.id;
        showToast(`Order #${placedOrderId} placed successfully!`);
        clearBag();
        navigate(`/order?order_id=${placedOrderId}`);
        return;
      }

      // COD Flow
      const orderResult = await createOrderMutation.mutateAsync({
        cart_id: targetCartId,
        payment_method: 'cod',
        delivery_address_id: effectiveAddressId,
        billing_address_id: effectiveAddressId,
        isPaid: false,
        coupons: appliedCoupon ? { [appliedCoupon.vendorId || 0]: appliedCoupon.code } : undefined,
      });

      const placedOrderId = orderResult?.id;
      showToast(`Order #${placedOrderId} placed successfully!`);
      clearBag();

      // Navigate to real order tracking
      navigate(`/order?order_id=${placedOrderId}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      showToast(err?.response?.data?.message || err?.message || 'Failed to complete transaction');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleOpenProduct = (productId: string | number) => {
    setPid(productId);
    go('product', { pid: productId });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] w-full min-h-[calc(100vh-140px)]">
      <SEO
        title="Your Doorstep Trial Bag — Yorder"
        description="Try clothes, sneakers, and tech at your door before paying. 10 minutes trial with the rider."
        canonical="https://yorder.com/bag"
      />

      {/* Left Column: Bag Items List */}
      <div className="p-6 md:p-[36px_34px_44px]">
        <div className="font-medium text-[9px] leading-none tracking-[0.18em] text-[var(--gold)]">
          TRY AT YOUR DOOR
        </div>
        <h1 className="font-light text-[32px] md:text-[42px] leading-[1.1] tracking-[-0.04em] text-[var(--t1)] mt-4">
          {hasItems
            ? `${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'} coming. Keep what fits.`
            : 'Your bag is empty.'}
        </h1>
        <p className="font-normal text-[13px] leading-[1.7] text-[var(--t3)] mt-4 max-w-[60ch]">
          {hasItems
            ? 'The showroom packs your order directly. The rider waits ten minutes at your door while you try everything on.'
            : 'Explore nearby verified showrooms to add clothes, shoes, and lifestyle goods to your trial bag.'}
        </p>

        {/* Grouped Showroom Shelves */}
        {isInitialSyncing ? (
          <div className="mt-8 flex flex-col gap-4">
            <BagItemSkeleton />
            <BagItemSkeleton />
          </div>
        ) : hasItems ? (
          <div className="mt-8 flex flex-col gap-6">
            {Object.entries(groupedByStore).map(([storeId, items]) => {
              const store = stores ? stores[storeId] : undefined;
              return (
                <div
                  key={storeId}
                  className="rounded-[20px] bg-[var(--s1)] border border-[var(--bd)] overflow-hidden"
                >
                  {/* Store Header */}
                  <div className="flex items-center justify-between p-4 bg-[var(--s2)]/40 border-b border-[var(--bd)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--s3)] flex items-center justify-center font-bold text-xs text-[var(--gold)] overflow-hidden">
                        {store?.img ? (
                          <img src={store.img} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          store?.ini || 'SH'
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[var(--t1)]">
                          {store?.name || items.find((it) => it.product)?.product?.brand || 'Verified Showroom'}
                        </div>
                        <div className="text-[10px] text-[var(--t3)]">
                          {store?.addr || 'Showroom Floor · Immediate Dispatch'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--ok)]">
                      {store?.eta || 'Arrives in 45 min'}
                    </span>
                  </div>

                  {/* Items in this Store */}
                  <div className="p-4 flex flex-col gap-3">
                    {items.map((item) => {
                      if (item.isResolving || !item.product) {
                        return <BagItemSkeleton key={`resolving-${item.bagIndex}`} />;
                      }

                      const prod = item.product;
                      return (
                        <div
                          key={`${prod.id}-${item.bagIndex}`}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-[14px] bg-[var(--s0)] border border-[var(--bd)]"
                        >
                          <div
                            onClick={() => handleOpenProduct(prod.id)}
                            className="w-[74px] h-[74px] rounded-[12px] overflow-hidden bg-white flex-shrink-0 cursor-pointer border border-[var(--bd)] p-1 flex items-center justify-center"
                          >
                            <img
                              src={prod.img}
                              alt={prod.name}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => handleOpenProduct(prod.id)}
                              className="font-medium text-[13.5px] leading-[1.4] text-[var(--t1)] hover:text-[var(--gold)] text-left line-clamp-1 transition-colors"
                            >
                              {prod.name}
                            </button>
                            <div className="text-[11px] text-[var(--t3)] mt-1.5 flex items-center gap-2">
                              <span>Size: {item.size || 'Standard'}</span>
                              <span>·</span>
                              <span className="text-[var(--gold)] font-medium">{prod.stock}</span>
                            </div>
                            <div className="font-semibold text-[14px] text-[var(--t1)] mt-2">
                              {rupee(prod.price)}
                            </div>
                          </div>

                          {/* Quantity Counter */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center border border-[var(--bdw)] rounded-full h-[32px] px-2 bg-[var(--s1)]">
                              <button
                                onClick={() => updateQuantity(item.bagIndex, -1)}
                                className="w-6 h-6 flex items-center justify-center text-[var(--t2)] hover:text-white font-bold"
                                title="Decrease"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-semibold text-[var(--t1)]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.bagIndex, 1)}
                                className="w-6 h-6 flex items-center justify-center text-[var(--t2)] hover:text-white font-bold"
                                title="Increase"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeAt(item.bagIndex)}
                              className="h-[32px] px-3 rounded-full border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 p-12 text-center rounded-[20px] bg-[var(--s1)] border border-[var(--bd)]">
            <div className="text-4xl mb-4">🛍️</div>
            <div className="font-semibold text-base text-[var(--t1)]">Your trial bag is currently empty</div>
            <p className="text-xs text-[var(--t3)] max-w-sm mx-auto mt-2 mb-6">
              Pick garments, sneakers, or lifestyle items from nearby showrooms. Try them at home for 10 minutes with the rider.
            </p>
            <button
              onClick={() => go('products')}
              className="px-6 py-2.5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Showroom Shelves
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Checkout Sidebar */}
      <aside className="p-6 md:p-[36px_34px_44px] bg-[var(--s1)] border-t lg:border-t-0 lg:border-l border-[var(--bd)] flex flex-col gap-5">
        {/* Delivery Address Card */}
        <div className="p-5 rounded-[20px] bg-[var(--s0)] border border-[var(--bd)]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-[9px] tracking-[0.16em] text-[var(--gold)]">
              DELIVER TO
            </span>
            {isAuthenticated && (
              <button
                onClick={() => setShowAddressModal(true)}
                className="text-[11px] font-semibold text-[var(--gold)] hover:underline"
              >
                {selectedAddress ? 'CHANGE' : '+ ADD ADDRESS'}
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--s1)] border border-[var(--bd)]">
              <span className="text-xs text-[var(--t2)]">Log in to select your delivery address</span>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-xs text-[var(--gold)] font-semibold hover:underline"
              >
                Log in
              </button>
            </div>
          ) : selectedAddress ? (
            <div>
              <div className="font-semibold text-xs text-[var(--t1)]">
                {selectedAddress.type?.name || 'Home'}
              </div>
              <div className="text-xs text-[var(--t2)] mt-1 leading-relaxed">
                {selectedAddress.formated_address || `${selectedAddress.address1}, ${selectedAddress.city}`}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[var(--t3)]">
              No delivery address selected. Click Add Address to set your delivery location.
            </div>
          )}
        </div>

        {/* Coupons & Promo Codes */}
        <div className="p-5 rounded-[20px] bg-[var(--s0)] border border-[var(--bd)]">
          <span className="font-medium text-[9px] tracking-[0.16em] text-[var(--gold)] block mb-3">
            OFFERS & DISCOUNTS
          </span>

          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[var(--ok)]/10 border border-[var(--ok)]/30">
              <div>
                <div className="font-bold text-xs text-[var(--ok)]">{appliedCoupon.code}</div>
                <div className="text-[10px] text-[var(--t3)]">₹{appliedCoupon.discount} discount applied</div>
              </div>
              <button
                onClick={removeCoupon}
                className="text-[10px] font-bold text-red-400 hover:underline"
              >
                REMOVE
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={20}
                placeholder="Enter coupon code (e.g. YORDER50)"
                aria-label="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--s1)] border border-[var(--bd)] text-[var(--t1)] focus:outline-none focus:border-[var(--gold)] font-mono tracking-wider"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={!couponInput.trim() || validateCouponMutation.isPending}
                className="px-4 py-2 rounded-xl bg-[var(--gold)] text-black text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {validateCouponMutation.isPending ? 'Verifying...' : 'APPLY'}
              </button>
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="p-5 rounded-[20px] bg-[var(--s0)] border border-[var(--bd)]">
          <span className="font-medium text-[9px] tracking-[0.16em] text-[var(--gold)] block mb-3">
            PAYMENT METHOD
          </span>

          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--bd)] cursor-pointer hover:bg-[var(--s1)] transition-colors">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="accent-[var(--gold)]"
              />
              <div className="flex-1">
                <div className="font-semibold text-xs text-[var(--t1)]">Cash on Delivery / Pay at Door</div>
                <div className="text-[10px] text-[var(--t3)]">Pay with UPI, card, or cash after trying at door</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--bd)] cursor-pointer hover:bg-[var(--s1)] transition-colors">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'razorpay'}
                onChange={() => setPaymentMethod('razorpay')}
                className="accent-[var(--gold)]"
              />
              <div className="flex-1">
                <div className="font-semibold text-xs text-[var(--t1)]">Pay Online (Razorpay)</div>
                <div className="text-[10px] text-[var(--t3)]">Instant prepaid order with Card/UPI/NetBanking</div>
              </div>
            </label>
          </div>
        </div>

        {/* Real Bill Breakdown */}
        <div className="p-5 rounded-[20px] bg-[var(--s0)] border border-[var(--bd)] flex flex-col gap-2.5">
          <span className="font-medium text-[9px] tracking-[0.16em] text-[var(--gold)] mb-1">
            BILL SUMMARY
          </span>

          <div className="flex justify-between text-xs text-[var(--t2)]">
            <span>Bag Subtotal</span>
            <span className="font-mono">{rupee(subtotal)}</span>
          </div>

          <div className="flex justify-between text-xs text-[var(--t2)]">
            <span>Delivery Fee</span>
            <span className="font-mono text-[var(--ok)]">{deliveryFee === 0 ? 'FREE' : rupee(deliveryFee)}</span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between text-xs text-[var(--ok)]">
              <span>Coupon Discount ({appliedCoupon.code})</span>
              <span className="font-mono">- {rupee(appliedCoupon.discount)}</span>
            </div>
          )}

          <div className="h-[1px] bg-[var(--bd)] my-1" />

          <div className="flex justify-between text-sm font-bold text-[var(--t1)]">
            <span>Total Payable</span>
            <span className="font-mono">{rupee(totalPayable)}</span>
          </div>
        </div>

        {/* Place Order CTA */}
        <button
          disabled={!hasItems || isSubmittingOrder}
          onClick={handleProceedToOrder}
          className="w-full h-[50px] rounded-[25px] flex items-center justify-center font-semibold text-[13px] transition-all shadow-md active:scale-98"
          style={{
            background: hasItems && !isSubmittingOrder ? (isAuthenticated ? 'var(--acc)' : 'var(--gold)') : 'var(--s2)',
            color: hasItems && !isSubmittingOrder ? (isAuthenticated ? 'var(--on-acc)' : '#0B0B0C') : 'var(--t3)',
            cursor: hasItems && !isSubmittingOrder ? 'pointer' : 'not-allowed',
          }}
        >
          {isSubmittingOrder
            ? 'Dispatching order to showroom...'
            : !isAuthenticated
            ? 'Log in with Mobile to Order'
            : paymentMethod === 'cod'
            ? 'Send the rider (Pay at door)'
            : 'Proceed to Pay Online'}
        </button>

        <p className="text-[10px] text-[var(--t3)] text-center leading-relaxed">
          Rider waits at your door for ten minutes. You only pay for what you decide to keep.
        </p>
      </aside>

      {/* Interactive Mobile-Style Address & Map Modal */}
      <AddressMapModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
      />
    </div>
  );
};
