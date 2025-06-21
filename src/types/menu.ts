export interface MenuFile {
  name: string;
  fullPath: string;
  url: string;
}

export interface MenuError extends Error {
  code?: string;
}
