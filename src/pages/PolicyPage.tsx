import React from 'react';
import { SEO } from '../components/common/SEO';

export interface PolicyPageProps {
  type: 'returns' | 'shipping' | 'contact' | 'terms' | 'privacy';
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ type }) => {
  const getPolicyContent = () => {
    switch (type) {
      case 'returns':
        return {
          title: 'Return & Refund Policy',
          canonical: 'https://ywsglobal.com/return-policy',
          description: 'Official Return and Refund Policy for Yorder (Yorder Webservices).',
          content: (
            <div className="space-y-6 text-sm leading-relaxed text-[var(--t2)]">
              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">1. 10-Minute Doorstep Trial & Instant Returns</h2>
                <p>
                  Every order on Yorder sits on a real shelf in a physical partner showroom near you.
                  When our delivery rider arrives at your doorstep, you have a complimentary 10-minute trial window
                  to inspect, try on, and verify the authenticity and sizing of your items.
                </p>
                <p className="mt-2">
                  If an item does not fit or meet your expectations, you may hand it back to the rider on the spot.
                  There are <strong>zero return fees</strong> or reverse-logistics charges for doorstep trial returns.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">2. Post-Delivery Return Window</h2>
                <p>
                  If you choose to keep the product but subsequently decide to return it, returns are accepted within
                  <strong> 7 days</strong> of delivery, provided that:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>The item is completely unused, unworn, and unwashed.</li>
                  <li>Original brand tags, security tags, and packaging are intact and attached.</li>
                  <li>The original invoice or digital order receipt is provided.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">3. Refund Processing & Timelines</h2>
                <p>
                  For online prepaid orders (Razorpay, UPI, Credit/Debit cards, Net Banking):
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Doorstep Rejections:</strong> The refund is initiated immediately and typically credits back to your original source account within 24 to 48 hours.</li>
                  <li><strong>Post-Delivery Returns:</strong> Once the returned item is physically received and inspected at the partner showroom, the refund is processed within 3 to 5 business days.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">4. Contact For Return Assistance</h2>
                <p>
                  To request a return pickup or inquire about an ongoing refund, contact our support team at:
                  <br />
                  <span className="text-[var(--gold)] font-mono">yorderweb@ywsglobal.com</span> | +91 99877 31604
                </p>
              </section>
            </div>
          ),
        };

      case 'shipping':
        return {
          title: 'Shipping & Delivery Policy',
          canonical: 'https://ywsglobal.com/shipping-policy',
          description: 'Official Shipping and Delivery Policy for Yorder (Yorder Webservices).',
          content: (
            <div className="space-y-6 text-sm leading-relaxed text-[var(--t2)]">
              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">1. Hyperlocal Express Delivery</h2>
                <p>
                  Yorder operates a direct showroom-to-door logistics network. Products are dispatched directly
                  from real partner showrooms in your local city (Mumbai metropolitan area).
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">2. Estimated Delivery Timeframe</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Instant Hyperlocal Delivery:</strong> Delivered within 98 minutes to 3 hours depending on your exact distance from the showroom.</li>
                  <li><strong>Scheduled Delivery:</strong> You can select a preferred delivery slot at checkout.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">3. Shipping Rates</h2>
                <p>
                  Standard delivery charge is <strong>₹10</strong> per order across our active delivery zones in Mumbai.
                  The delivery fee is transparently shown at checkout before order placement.
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">4. Live Order Tracking</h2>
                <p>
                  Upon order confirmation and rider assignment, you will receive real-time status updates and rider coordinates directly in the Yorder App and Web order screen.
                </p>
              </section>
            </div>
          ),
        };

      case 'contact':
        return {
          title: 'Contact Customer Support',
          canonical: 'https://ywsglobal.com/contact',
          description: 'Contact Yorder Webservices customer support and business operations.',
          content: (
            <div className="space-y-6 text-sm leading-relaxed text-[var(--t2)]">
              <section className="bg-[var(--s1)] p-6 rounded-2xl border border-[var(--s2)] space-y-4">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--gold)]">Legal Entity</h3>
                  <p className="text-base font-semibold text-[var(--t1)] mt-1">Yorder Webservices</p>
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--gold)]">Customer Support Email</h3>
                  <p className="text-[var(--t1)] font-mono mt-1">
                    <a href="mailto:yorderweb@ywsglobal.com" className="hover:underline">yorderweb@ywsglobal.com</a>
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--gold)]">Helpline / WhatsApp</h3>
                  <p className="text-[var(--t1)] font-mono mt-1">+91 99877 31604</p>
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--gold)]">Registered Office & Showroom Hub</h3>
                  <p className="text-[var(--t1)] mt-1">
                    Yorder Webservices<br />
                    Linking Road, Bandra West<br />
                    Mumbai, Maharashtra 400052, India
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--gold)]">Customer Service Hours</h3>
                  <p className="text-[var(--t1)] mt-1">Monday – Sunday: 10:00 AM – 10:00 PM IST</p>
                </div>
              </section>
            </div>
          ),
        };

      case 'terms':
        return {
          title: 'Terms of Service',
          canonical: 'https://ywsglobal.com/terms',
          description: 'Terms of service and customer conditions for Yorder Webservices.',
          content: (
            <div className="space-y-6 text-sm leading-relaxed text-[var(--t2)]">
              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">1. Agreement to Terms</h2>
                <p>
                  By accessing or using Yorder (operated by Yorder Webservices at ywsglobal.com), you agree to be bound by these terms.
                  Yorder provides a hyperlocal platform bridging physical retail showroom inventories with doorstep trials and rapid delivery.
                </p>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">2. Product Authenticity & Verification</h2>
                <p>
                  All products featured on Yorder are physical units located in verified retail partner stores. We guarantee genuine, authentic products directly sourced from verified retail partners.
                </p>
              </section>
            </div>
          ),
        };

      case 'privacy':
      default:
        return {
          title: 'Privacy Policy',
          canonical: 'https://ywsglobal.com/privacy',
          description: 'Privacy Policy and data protection terms for Yorder Webservices.',
          content: (
            <div className="space-y-6 text-sm leading-relaxed text-[var(--t2)]">
              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">1. Information We Collect</h2>
                <p>
                  Yorder Webservices collects phone numbers, delivery coordinates, and basic contact details solely for facilitating order placement, delivery navigation, and transaction verification.
                </p>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--t1)] mb-2">2. Data Security & Payment Information</h2>
                <p>
                  Payment processing is handled via PCI-DSS compliant payment gateways (such as Razorpay). We never store complete credit/debit card numbers or UPI PINs on our servers.
                </p>
              </section>
            </div>
          ),
        };
    }
  };

  const { title, canonical, description, content } = getPolicyContent();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16 w-full">
      <SEO title={`${title} | Yorder`} description={description} canonical={canonical} />
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--t1)] mb-8">
        {title}
      </h1>
      {content}
    </div>
  );
};
