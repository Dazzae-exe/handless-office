// Las variables se leen de forma literal para que Next las incruste en el bundle del cliente.
export const TABLES = {
  posts: (process.env.NEXT_PUBLIC_SUPABASE_POSTS_TABLE || 'posts') as 'posts',
  images: (process.env.NEXT_PUBLIC_SUPABASE_IMAGES_TABLE || 'images') as 'images',
} as const;

const ANALYTICS_PREFIX = process.env.NEXT_PUBLIC_SUPABASE_ANALYTICS_PREFIX || 'analytics_';

export const VIEWS = {
  summary: `${ANALYTICS_PREFIX}summary` as 'analytics_summary',
  daily: `${ANALYTICS_PREFIX}daily` as 'analytics_daily',
  topPosts: `${ANALYTICS_PREFIX}top_posts` as 'analytics_top_posts',
} as const;
