import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ellipsify(str = '', len = 4, delimiter = '..') {
  const strLen = str.length
  const limit = len * 2 + delimiter.length

  return strLen >= limit ? str.substring(0, len) + delimiter + str.substring(strLen - len, strLen) : str
}

// src/lib/utils/navigation.ts
export function getHomeUrl() {
  if (typeof window === 'undefined') return '/';

  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  if (hostname.startsWith('sandras-sandwiches.')) {
    // Remove the subdomain and redirect to main domain
    const mainDomain = hostname.replace('sandras-sandwiches.', '');
    return `${protocol}//${mainDomain}${port ? `:${port}` : ''}`;
  }

  return '/';
}

export function getSubdomain(hostname?: string): string {
  const host = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
  
  if (!host) return '';
  
  const parts = host.split('.');
  
  // For localhost development (e.g., sandras-sandwiches.localhost:5002)
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== '127') {
      return parts[0];
    }
  } 
  // For production (e.g., sandras-sandwiches.yourdomain.com)
  else if (parts.length > 2) {
    return parts[0];
  }
  
  return '';
}