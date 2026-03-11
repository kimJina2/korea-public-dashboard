import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getAqiGrade(value: number | string): {
  label: string;
  color: string;
  bg: string;
} {
  const grade = typeof value === "string" ? value : String(value);
  switch (grade) {
    case "1":
    case "좋음":
      return { label: "좋음", color: "text-blue-600", bg: "bg-blue-100" };
    case "2":
    case "보통":
      return { label: "보통", color: "text-green-600", bg: "bg-green-100" };
    case "3":
    case "나쁨":
      return { label: "나쁨", color: "text-orange-600", bg: "bg-orange-100" };
    case "4":
    case "매우나쁨":
      return { label: "매우나쁨", color: "text-red-600", bg: "bg-red-100" };
    default:
      return { label: "알수없음", color: "text-gray-600", bg: "bg-gray-100" };
  }
}
