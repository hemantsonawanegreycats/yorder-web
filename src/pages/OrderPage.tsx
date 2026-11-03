import React, { useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useChatStore } from '../stores/useChatStore';
import { useOrdersQuery, useOrderByIdQuery, useCancelOrderMutation } from '../api/orders.api';
import { rupee, formatClock } from '../utils/formatters';
import { SEO } from '../components/common/SEO';
import { OrderTrackerSkeleton, BagItemSkeleton, ErrorState } from '../components/common/Skeleton';

const STEPS = [
  { key: 'picked', label: 'Picked' },
  { key: 'sealed', label: 'Sealed' },
  { key: 'rider', label: 'Rider' },
  { key: 'door', label: 'Your door' },
];

function getActiveStepIndex(statusName: string = ''): number {
  const s = statusName.toLowerCase();
  if (['pending', 'placed', 'accepted'].includes(s)) return 0;
  if (['processing', 'inprocess', 'sealed'].includes(s)) return 1;
  if (['indelivery', 'dispatched', 'on the way', 'out_for_delivery'].includes(s)) return 2;
  if (['delivered', 'completed'].includes(s)) return 3;
  return 0;
}

export const OrderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { orderId: paramOrderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { go, showToast } = useAppStore();
  const { setActiveChatId } = useChatStore();

  const urlOrderId = searchParams.get('order_id') || paramOrderId;

  // Query all orders to locate latest if none specified
  const { data: allOrders, isLoading: allOrdersLoading } = useOrdersQuery();

  const activeOrderId = urlOrderId
    ? Number(urlOrderId)
    : allOrders && allOrders.length > 0
    ? allOrders[0].id
    : null;

  // Real order query with 10s live polling
  const { data: order, isLoading: orderLoading } = useOrderByIdQuery(activeOrderId, !!activeOrderId);
  const cancelOrderMutation = useCancelOrderMutation();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const statusName = order?.current_order_status?.name || 'accepted';
  const activeStepIdx = getActiveStepIndex(statusName);
  const isCancelled = statusName.toLowerCase() === 'cancelled';
  const isDelivered = statusName.toLowerCase() === 'delivered' || !!order?.orderCompleted;
  const isLive = !isCancelled && !isDelivered;

  const progressPercents = [18, 48, 78, 100];
  const progressWidth = `${progressPercents[activeStepIdx]}%`;

  const rider = order?.delivery_by?.user;
  const riderName = rider ? `${rider.first_name || ''} ${rider.last_name || ''}`.trim() : null;
  const riderPhone = order?.delivery_by?.user?.phone?.number;

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await cancelOrderMutation.mutateAsync({
        orderId: order.id,
        comment: 'Cancelled by customer from web tracking',
      });
      showToast(`Order #${order.id} has been cancelled`);
      setShowCancelDialog(false);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMessageVendor = () => {
    if (order?.vendor?.id) {
      setActiveChatId(`vendor-${order.vendor.id}`);
      go('chat');
    } else {
      go('chat');
    }
  };

  if (allOrdersLoading || (activeOrderId && orderLoading)) {
    return (
      <div className="max-w-[920px] w-full mx-auto px-4 md:px-[34px] py-10 md:py-[52px] pb-[64px] min-h-[calc(100vh-140px)] flex flex-col gap-6">
        <OrderTrackerSkeleton />
        <div className="flex flex-col gap-3 mt-4">
          <BagItemSkeleton />
          <BagItemSkeleton />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-[920px] w-full mx-auto px-4 md:px-[34px] py-16 text-center min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="text-4xl mb-2">📦</div>
        <h2 className="text-xl font-bold text-[var(--t1)]">No active order to track</h2>
        <p className="text-xs text-[var(--t3)] max-w-sm">
          You don't have any ongoing deliveries right now. Select items from nearby showrooms to try at your door.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => go('products')}
            className="px-6 py-2.5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold"
          >
            Explore Showrooms
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2.5 rounded-full border border-[var(--bd)] text-xs font-semibold text-[var(--t1)]"
          >
            View Past Orders
          </button>
        </div>
      </div>
    );
  }

  const items = order.item || [];
  const itemCount = items.reduce((sum, it) => sum + (it.quantity || 1), 0);

  return (
    <div className="max-w-[920px] w-full mx-auto px-4 md:px-[34px] py-10 md:py-[52px] pb-[64px] min-h-[calc(100vh-140px)]">
      <SEO
        title={`Order #${order.id} Tracking — Yorder`}
        description="Real-time doorstep trial delivery tracking."
        canonical={`https://yorder.com/order?order_id=${order.id}`}
      />

      {/* Real Order Identifier Header */}
      <div className="flex items-center justify-between">
        <div className="font-medium text-[9px] leading-none tracking-[0.18em] text-[var(--gold)]">
          ORDER #{order.id}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
            isCancelled
              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
              : isDelivered
              ? 'bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30'
              : 'bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 animate-pulse'
          }`}
        >
          {statusName.toUpperCase()}
        </span>
      </div>

      <h1 className="font-light text-[32px] md:text-[42px] leading-[1.1] tracking-[-0.04em] text-[var(--t1)] mt-4">
        {isCancelled
          ? 'This order was cancelled.'
          : isDelivered
          ? 'At your door. Try them now.'
          : activeStepIdx === 2
          ? 'The rider is on the road.'
          : activeStepIdx === 1
          ? 'Sealed and labelled at counter.'
          : `${order.vendor?.name || 'Showroom'} is packing your bag.`}
      </h1>

      <p className="font-normal text-[13px] leading-[1.7] text-[var(--t3)] mt-3 max-w-[65ch]">
        {order.current_order_status?.comment ||
          (isDelivered
            ? 'The rider waits ten minutes at your door while you try items on. You only keep and pay for what fits.'
            : isCancelled
            ? 'Items were returned to the showroom shelf. No charge has been made.'
            : 'Sealed showroom packaging dispatched directly to your address.')}
      </p>

      {/* Stepper Card */}
      {!isCancelled && (
        <div className="mt-8 p-6 md:p-[26px_28px] rounded-[20px] bg-[var(--s0)] border border-[#C8A06A]/30 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-[9px] tracking-[0.16em] text-[var(--gold)]">
              <span className="w-[6px] h-[6px] rounded-full bg-[var(--gold)] animate-ping" />
              {isDelivered ? 'COMPLETED' : activeStepIdx === 2 ? 'OUT FOR DELIVERY' : 'IN PROGRESS'}
            </div>
            <div className="font-mono font-medium text-[11.5px] text-[var(--t2)]">
              ETA: ~35 MIN
            </div>
          </div>

          {/* Stepper Bar */}
          <div className="relative mt-8 mb-4">
            {/* Background Track */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-[var(--s2)]" />
            {/* Active Track */}
            <div
              className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-[var(--gold)] transition-all duration-700"
              style={{ width: progressWidth }}
            />

            {/* Step Dots */}
            <div className="relative flex justify-between">
              {STEPS.map((s, idx) => {
                const isPassed = idx < activeStepIdx;
                const isCurrent = idx === activeStepIdx;
                return (
                  <div key={s.key} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all z-10 ${
                        isCurrent
                          ? 'bg-[var(--gold)] text-black ring-4 ring-[var(--gold)]/20 shadow-md scale-110'
                          : isPassed
                          ? 'bg-[var(--gold)] text-black'
                          : 'bg-[var(--s2)] text-[var(--t3)] border border-[var(--bd)]'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] mt-2 font-medium ${
                        isCurrent
                          ? 'text-[var(--gold)] font-bold'
                          : isPassed
                          ? 'text-[var(--t1)]'
                          : 'text-[var(--t3)]'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rider & OTP Section (if assigned) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Showroom & Rider Details */}
        <div className="p-5 rounded-[20px] bg-[var(--s1)] border border-[var(--bd)]">
          <div className="font-medium text-[9px] tracking-[0.16em] text-[var(--gold)] mb-3">
            SHOWROOM & DISPATCH
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--s2)] flex items-center justify-center font-bold text-xs text-[var(--gold)] overflow-hidden">
              {order.vendor?.icon ? (
                <img src={order.vendor.icon} alt={order.vendor.name} className="w-full h-full object-cover" />
              ) : (
                'SH'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-[var(--t1)]">
                {order.vendor?.name || 'Verified Showroom Partner'}
              </div>
              <div className="text-[11px] text-[var(--t3)] mt-0.5">
                {riderName ? `Rider: ${riderName}` : 'Assigned showroom delivery fleet'}
              </div>
            </div>
            {riderPhone && (
              <a
                href={`tel:${riderPhone}`}
                className="px-3 py-1.5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-[10.5px] font-bold"
              >
                Call Rider
              </a>
            )}
          </div>
        </div>

        {/* Delivery Address & OTP */}
        <div className="p-5 rounded-[20px] bg-[var(--s1)] border border-[var(--bd)]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-[9px] tracking-[0.16em] text-[var(--gold)]">
              DESTINATION
            </span>
            {order.deliveryOtp && (
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--gold)] text-black font-mono font-bold text-[10px]">
                OTP: {order.deliveryOtp}
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--t1)] leading-relaxed">
            {order.delivery_address?.formated_address || 'Customer Delivery Address'}
          </div>
          <div className="text-[10px] text-[var(--t3)] mt-2">
            Payment: {order.isPaid ? 'Paid Online' : 'Cash on Delivery (Pay at door)'}
          </div>
        </div>
      </div>

      {/* Real Items In The Bag */}
      <div className="mt-8">
        <h3 className="font-semibold text-[18px] text-[var(--t1)] mb-4">
          Items in this delivery ({itemCount})
        </h3>

        <div className="flex flex-col gap-3">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 rounded-[18px] bg-[var(--s1)] border border-[var(--bd)]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-[12px] bg-[var(--s2)] overflow-hidden flex-shrink-0 border border-[var(--bd)]">
                  {it.product?.image ? (
                    <img src={it.product.image} alt={it.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[var(--t3)]">
                      Bag
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-xs text-[var(--t1)] line-clamp-1">
                    {it.product?.name || 'Showroom Product'}
                  </div>
                  <div className="text-[11px] text-[var(--t3)] mt-1">
                    Quantity: {it.quantity || 1}
                  </div>
                </div>
              </div>

              <div className="font-semibold text-xs font-mono text-[var(--t1)] flex-shrink-0 ml-4">
                {rupee(it.price * (it.quantity || 1))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real Bill Breakdown Card */}
      <div className="mt-6 p-6 rounded-[20px] bg-[var(--s0)] border border-[var(--bd)]">
        <div className="font-medium text-[9px] tracking-[0.16em] text-[var(--gold)] mb-3">
          ORDER FINANCIAL SUMMARY
        </div>

        <div className="flex flex-col gap-2.5 text-xs text-[var(--t2)]">
          <div className="flex justify-between">
            <span>Bag Value</span>
            <span className="font-mono">{rupee(order.totalAmount)}</span>
          </div>

          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-mono text-[var(--ok)]">
              {order.deliveryFee === 0 ? 'FREE' : rupee(order.deliveryFee)}
            </span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-[var(--ok)]">
              <span>Discounts Applied</span>
              <span className="font-mono">- {rupee(order.discount)}</span>
            </div>
          )}

          <div className="h-[1px] bg-[var(--bd)] my-1" />

          <div className="flex justify-between text-sm font-bold text-[var(--t1)]">
            <span>Total Payable Amount</span>
            <span className="font-mono">{rupee(order.payAmount)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4 mt-8">
        <button
          onClick={handleMessageVendor}
          className="px-6 py-3 rounded-full bg-[var(--acc)] text-[var(--on-acc)] text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Message Showroom
        </button>

        <button
          onClick={() => go('products')}
          className="px-6 py-3 rounded-full bg-[var(--s1)] border border-[var(--bd)] text-[var(--t1)] text-xs font-semibold hover:bg-[var(--s2)] transition-colors"
        >
          Keep Browsing
        </button>

        {isLive && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="px-6 py-3 rounded-full border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors ml-auto"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--s0)] border border-[var(--bd)] p-6 shadow-2xl">
            <h3 className="font-bold text-sm text-[var(--t1)]">Cancel this order?</h3>
            <p className="text-xs text-[var(--t3)] mt-2 leading-relaxed">
              If the showroom has already dispatched the rider, they will be called back to the showroom floor.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--t2)] hover:bg-[var(--s1)]"
              >
                Keep Order
              </button>
              <button
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
