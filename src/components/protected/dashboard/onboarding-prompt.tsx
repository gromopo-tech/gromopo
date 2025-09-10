"use client";

import Link from 'next/link';
import type { OnboardingStep } from '@/hooks/useOnboardingStatus';

interface OnboardingPromptProps {
  step: OnboardingStep;
  title?: string;
  message?: string;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
}

const defaultContent = {
  'upload-menu': {
    title: 'Upload a menu to get started',
    message: "We couldn't find any menu files for your business. Upload a menu first to get started.",
    buttonText: 'Go to Menus',
    buttonHref: '/dashboard/menus'
  },
  'add-wallet': {
    title: 'Add a wallet to start receiving orders',
    message: 'Add a Solana wallet to start accepting orders and payments.',
    buttonText: 'Add a wallet',
    buttonHref: '/dashboard/settings'
  },
  'print-qr': {
    title: 'Your menu is live! Print and display your QR code to start accepting orders',
    message: 'Customers can scan your QR code to view your menu and place orders. Print it out and display it at your business to get started.',
    buttonText: 'Print QR code',
    buttonHref: ''
  },
  'complete': {
    title: 'Setup Complete',
    message: 'Your business is ready to receive orders!',
    buttonText: null,
    buttonHref: null
  }
};

export function OnboardingPrompt({
  step,
  title,
  message,
  buttonText,
  buttonHref,
  className = ""
}: OnboardingPromptProps) {
  const content = defaultContent[step];
  const finalTitle = title || content.title;
  const finalMessage = message || content.message;
  const finalButtonText = buttonText || content.buttonText;
  const finalButtonHref = buttonHref || content.buttonHref;

  // Determine background color based on step
  const bgColor = step === 'add-wallet' 
    ? 'bg-amber-50 dark:bg-amber-950' 
    : 'bg-blue-50 dark:bg-blue-950';

  return (
    <div className={`rounded p-6 border ${bgColor} ${className}`}>
      <h2 className="text-lg font-semibold mb-2">{finalTitle}</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">{finalMessage}</p>
      {finalButtonText && finalButtonHref && (
        <Link
          href={finalButtonHref}
          className="btn border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded inline-block"
        >
          {finalButtonText}
        </Link>
      )}
    </div>
  );
}
