import useSWR from "swr";
import type { BusRouteItem } from "@/types/transit";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTransit(city: string = "서울", page: number = 1) {
  const { data, error, isLoading } = useSWR(
    `/api/transit?city=${encodeURIComponent(city)}&page=${page}`,
    fetcher,
    { refreshInterval: 3600000 } // 1시간
  );

  const raw = data?.response?.body?.items?.item;
  const items: BusRouteItem[] = raw
    ? Array.isArray(raw)
      ? raw
      : [raw]
    : [];
  const totalCount: number = data?.response?.body?.totalCount ?? 0;

  return { items, totalCount, error, isLoading };
}
