export type StatusFilter = 'all' | 'published' | 'draft';

export interface ListParams {
  status: StatusFilter;
  q: string;
  page: number;
  tag: string | null;
}
