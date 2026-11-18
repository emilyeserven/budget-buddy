import { useQuery } from "@tanstack/react-query";

import { CSV_FORMATS_QUERY_KEY } from "@/hooks/queryKeys";
import { csvFormatsApi } from "@/lib/api/csvFormats";

export function useCsvFormats() {
  return useQuery({
    queryKey: CSV_FORMATS_QUERY_KEY,
    queryFn: csvFormatsApi.list,
  });
}
