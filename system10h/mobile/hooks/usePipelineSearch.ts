import Fuse, { type IFuseOptions } from 'fuse.js';
import { useMemo, useState } from 'react';

const fuseOptions: IFuseOptions<any> = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'company', weight: 0.3 },
    { name: 'nextStep', weight: 0.1 },
    { name: 'email', weight: 0.1 },
  ],
  threshold: 0.3,
  minMatchCharLength: 2,
};

export function usePipelineSearch(items: any[]) {
  const [query, setQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);

  const statusFiltered = useMemo(
    () => activeStatus === undefined ? items : items.filter((i: any) => {
      const s = (i.status || '').toLowerCase();
      if (activeStatus === 'active') return s.includes('kontakt') || s.includes('kwalifikac') || s.includes('próbk') || s.includes('dogryw') || s === 'active';
      if (activeStatus === 'nurture') return s.includes('baza') || s.includes('research') || s === 'nurture';
      return s === activeStatus;
    }),
    [items, activeStatus]
  );

  const fuse = useMemo(() => new Fuse(statusFiltered, fuseOptions), [statusFiltered]);

  const results = useMemo(() => {
    if (!query.trim()) return statusFiltered;
    return fuse.search(query).map((r) => r.item);
  }, [fuse, query, statusFiltered]);

  return { query, setQuery, activeStatus, setActiveStatus, results, total: items.length };
}
