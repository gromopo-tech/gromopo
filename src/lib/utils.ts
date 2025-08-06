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

export function isSubdomain() {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.includes('.') && 
         !hostname.startsWith('localhost') && 
         !hostname.startsWith('127.0.0.1') &&
         hostname !== 'gromopo.com';
}