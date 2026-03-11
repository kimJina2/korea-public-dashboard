import useSWR from "swr";
import type { AirQualityItem } from "@/types/air-quality";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAirQuality(city: string = "서울") {
  const { data, error, isLoading } = useSWR(
    `/api/air-quality?city=${encodeURIComponent(city)}`,
    fetcher,
    { refreshInterval: 300000 } // 5분
  );

  const items: AirQualityItem[] = data?.response?.body?.items ?? [];

  return { items, error, isLoading };
}
