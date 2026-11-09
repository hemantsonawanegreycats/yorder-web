/**
 * Razorpay Standard Web Checkout Loader & Launcher
 * Matches production mobile configuration from Yorder-Cutsomer-1/utils/razorpay/razorpay.tsx
 */

export const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_q8hoDqsXGIQoqd';

export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
}

export interface RazorpaySuccessData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

let razorpayScriptPromise: Promise<boolean> | null = null;

export const loadRazorpayScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay Checkout script');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

export const openRazorpayCheckout = async (
  options: RazorpayCheckoutOptions
): Promise<{ success: boolean; data?: RazorpaySuccessData; error?: string }> => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    return { success: false, error: 'Could not load Razorpay payment gateway' };
  }

  if (!RAZORPAY_KEY_ID) {
    console.error('Razorpay key is missing: VITE_RAZORPAY_KEY_ID is not configured in .env');
    return {
      success: false,
      error: 'Payment gateway is not configured. Please check VITE_RAZORPAY_KEY_ID in your environment file.',
    };
  }

  return new Promise((resolve) => {
    const rzpOptions = {
      key: RAZORPAY_KEY_ID,
      amount: options.amount,
      currency: options.currency || 'INR',
      name: options.name || import.meta.env.VITE_RAZORPAY_NAME || 'Yorder',
      description: options.description || 'Yorder Doorstep Trial Order',
      image: import.meta.env.VITE_BRAND_LOGO_URL || '/assets/logo-dark.png',
      order_id: options.orderId,
      prefill: options.prefill || {},
      notes: options.notes || {},
      theme: {
        color: '#C8A06A', // Yorder Gold
      },
      handler: (response: RazorpaySuccessData) => {
        resolve({ success: true, data: response });
      },
      modal: {
        ondismiss: () => {
          resolve({ success: false, error: 'Payment was cancelled by user' });
        },
      },
    };

    try {
      const rzpInstance = new (window as any).Razorpay(rzpOptions);
      rzpInstance.on('payment.failed', (resp: any) => {
        resolve({
          success: false,
          error: resp?.error?.description || 'Payment failed',
        });
      });
      rzpInstance.open();
    } catch (e: any) {
      resolve({ success: false, error: e?.message || 'Failed to initialize Razorpay checkout' });
    }
  });
};
