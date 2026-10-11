import {api} from "@/lib/api";
export const getReport = (range = "month") => api(`/api/reports/overview?range=${encodeURIComponent(range)}`);
