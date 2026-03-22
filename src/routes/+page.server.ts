import { error } from '@sveltejs/kit';

type LoadFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function load({ fetch }: { fetch: LoadFetch }) {
  const res = await fetch('/api/pokemon-index');
  if (!res.ok) {
    error(res.status, 'Failed to load Pokémon index');
  }
  const all = (await res.json()) as { id: number; name: string }[];
  return { all };
}