import type { ReactNode } from 'react';

declare global {
  type PageProps<_Route extends string = string> = {
    params: Promise<Record<string, string>>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  };

  type LayoutProps<_Route extends string = string> = {
    children: ReactNode;
    params?: Promise<Record<string, string>>;
  };
}

export {};
