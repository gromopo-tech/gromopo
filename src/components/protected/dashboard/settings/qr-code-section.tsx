'use client';

import { useState } from 'react';
import Image from 'next/image';

interface QRCodeSectionProps {
  businessId: string;
}

export function QRCodeSection({ businessId }: QRCodeSectionProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const orderUrl = `https://${businessId}.gromopo.com/order`;

  const generateQRCode = async () => {
    setLoading(true);
    try {
      // Generate QR code using external service
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(orderUrl)}`;
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!qrCodeUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${businessId}</title>
            <style>
              body { margin: 0; padding: 40px; text-align: center; font-family: Arial, sans-serif; }
              .qr-container { display: inline-block; border: 2px solid #333; padding: 30px; background: white; }
              h1 { margin-top: 0; color: #333; }
              .url { margin-top: 15px; font-size: 16px; color: #666; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>Scan to Order</h1>
              <img src="${qrCodeUrl}" alt="QR Code" width="300" height="300" />
              <div class="url">${orderUrl}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = async () => {
    if (!qrCodeUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `${businessId}-qr-code.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        QR Code for Orders
      </h2>
      
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Generate a QR code that customers can scan to view your menu and place orders.
      </div>

      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Your ordering page:
        </p>
        <a 
          href={orderUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-mono text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded inline-block"
        >
          {orderUrl}
        </a>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Generating QR code...</span>
        </div>
      ) : qrCodeUrl ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-white">
              <Image
                src={qrCodeUrl}
                alt="QR Code for ordering"
                width={300}
                height={300}
                className="block"
              />
            </div>
          </div>
          
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Print QR Code
            </button>
            
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Download PNG
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Click below to generate a QR code for your ordering page.
          </p>
          <button
            onClick={generateQRCode}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            Generate QR Code
          </button>
        </div>
      )}
    </div>
  );
}