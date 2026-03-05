import { createContext, useContext, useState, ReactNode } from 'react';

interface PageBreadcrumbContextType {
  breadcrumbTitle: string | null;
  setBreadcrumbTitle: (title: string | null) => void;
}

const PageBreadcrumbContext = createContext<PageBreadcrumbContextType | undefined>(undefined);

export function PageBreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbTitle, setBreadcrumbTitle] = useState<string | null>(null);
  return (
    <PageBreadcrumbContext.Provider value={{ breadcrumbTitle, setBreadcrumbTitle }}>
      {children}
    </PageBreadcrumbContext.Provider>
  );
}

export function usePageBreadcrumb() {
  const context = useContext(PageBreadcrumbContext);
  return context ?? { breadcrumbTitle: null, setBreadcrumbTitle: () => {} };
}
