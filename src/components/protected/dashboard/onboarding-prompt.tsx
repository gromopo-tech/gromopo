"use client";

import Link from 'next/link';
import { useContext } from 'react';
import { BusinessIdContext } from '@/components/protected/business-id-provider';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import type { OnboardingStep } from '@/hooks/useOnboardingStatus';
import { getOrderUrl } from '@/lib/utils';

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
    title: 'Save and display your QR code to start accepting orders',
    message: 'Customers can scan your QR code to view your menu and place orders. View and print your QR code from your account settings.',
    buttonText: 'View QR code',
    buttonHref: '/dashboard/settings'
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
  const businessId = useContext(BusinessIdContext);
  const { markComplete } = useOnboardingStatus();
  const content = defaultContent[step];
  
  // Generate custom message for print-qr step to include the subdomain URL
  const getCustomMessage = () => {
    if (step === 'print-qr' && businessId) {
        const url = getOrderUrl(businessId);
      return (
      <>
        Your ordering page is live at{' '}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          {url}
        </a>
        {'\n'}Customers can scan your QR code to view your menu and place orders. View and print your QR code from your account settings.
      </>
    );
  }
    return message || content.message;
  };

  const finalTitle = title || content.title;
  const finalMessage = getCustomMessage();
  const finalButtonText = buttonText || content.buttonText;
  const finalButtonHref = buttonHref || content.buttonHref;

  const handleDoneClick = async () => {
    await markComplete();
    // Force a reload of the page to show updated state
    window.location.reload();
  };

  // Determine background color based on step
  const bgColor = step === 'add-wallet' 
    ? 'bg-amber-50 dark:bg-amber-950' 
    : step === 'print-qr'
    ? 'bg-green-50 dark:bg-green-950'
    : 'bg-blue-50 dark:bg-blue-950';

  return (
    <div className={`rounded p-6 border ${bgColor} ${className}`}>
      <h2 className="text-lg font-semibold mb-2">{finalTitle}</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">{finalMessage}</p>
      {finalButtonText && (
        <>
          {step === 'print-qr' ? (
            <div className="flex gap-3 flex-wrap">
              {finalButtonHref && (
                <Link
                  href={finalButtonHref}
                  className="btn border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded inline-block"
                >
                  {finalButtonText}
                </Link>
              )}
              <button
                onClick={handleDoneClick}
                className="btn border hover:bg-green-100 dark:hover:bg-green-800 bg-green-200 dark:bg-green-700 text-gray-900 dark:text-white px-4 py-2 rounded"
              >
                Done
              </button>
            </div>
          ) : finalButtonHref ? (
            <Link
              href={finalButtonHref}
              className="btn border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded inline-block"
            >
              {finalButtonText}
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
