import useSWR from "swr";
import type { WeatherItem, ProcessedWeather } from "@/types/weather";
import { SKY_CODE, PTY_CODE } from "@/types/weather";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function processWeatherItems(items: WeatherItem[]): ProcessedWeather[] {
  const grouped: Record<string, Partial<ProcessedWeather>> = {};

  for (const item of items) {
    const key = `${item.fcstDate}_${item.fcstTime}`;
    if (!grouped[key]) {
      grouped[key] = {
        date: `${item.fcstDate.slice(0, 4)}-${item.fcstDate.slice(4, 6)}-${item.fcstDate.slice(6, 8)}`,
        time: `${item.fcstTime.slice(0, 2)}:${item.fcstTime.slice(2, 4)}`,
      };
    }
    switch (item.category) {
      case "TMP":
        grouped[key].temp = item.fcstValue;
        break;
      case "SKY":
        grouped[key].sky = SKY_CODE[item.fcstValue] ?? item.fcstValue;
        break;
      case "PTY":
        grouped[key].pty = PTY_CODE[item.fcstValue] ?? item.fcstValue;
        break;
      case "POP":
        grouped[key].pop = item.fcstValue;
        break;
      case "REH":
        grouped[key].humidity = item.fcstValue;
        break;
      case "WSD":
        grouped[key].windSpeed = item.fcstValue;
        break;
    }
  }

  return Object.values(grouped)
    .filter((w) => w.temp !== undefined)
    .slice(0, 24) as ProcessedWeather[];
}

export function useWeather(city: string = "서울") {
  const { data, error, isLoading } = useSWR(
    `/api/weather?city=${encodeURIComponent(city)}`,
    fetcher,
    { refreshInterval: 3600000 } // 1시간
  );

  const rawItems: WeatherItem[] = data?.response?.body?.items?.item ?? [];
  const forecasts = processWeatherItems(rawItems);

  return { forecasts, error, isLoading };
}
