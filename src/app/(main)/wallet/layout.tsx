import Script from "next/script";

/**
 * Wallet layout — loads Midtrans Snap.js for payment popup.
 * Script ini di-load di level layout supaya tersedia di semua wallet pages.
 */
export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Midtrans Snap.js — Sandbox mode */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""}
        strategy="lazyOnload"
      />
      {children}
    </>
  );
}
