// src/app/(components)/Page.tsx
import { useInfiniteQuery, QueryFunctionContext } from "@tanstack/react-query";
import Fetch from "@/utils/Fetch";
import { Dayjs } from "dayjs";

// Define interfaces for the data structures used in the calendar
export interface IRoomInventory {
  id: string;
  date: Dayjs;
  available: number;
  status: boolean;
  booked: number;
}

export interface IRoomRatePlans {
  id: number;
  name: string;
}

export interface IRateCalendar {
  id: string;
  date: Dayjs;
  rate: number;
  min_length_of_stay: number;
  reservation_deadline: number;
}

export interface IRatePlanCalendar extends IRoomRatePlans {
  calendar: Array<IRateCalendar>;
}

export interface IRoomCategory {
  id: string;
  name: string;
  occupancy: number;
}

export interface IRoomCategoryCalender extends IRoomCategory {
  inventory_calendar: Array<IRoomInventory>;
  rate_plans: Array<IRatePlanCalendar>;
}

// Define the parameters and response interfaces for the hook
interface IParams {
  property_id: number;
  start_date: string;
  end_date: string;
}

interface IResponse {
  room_categories: Array<IRoomCategoryCalender>;
  nextCursor?: number; // Available if you pass a cursor as a query parameter
}

// Custom hook to fetch room rate availability calendar data with infinite scrolling
export default function useRoomRateAvailabilityCalendar(params: IParams) {
  return useInfiniteQuery<IResponse>({
    queryKey: ["property_room_calendar", params], // Unique query key
    queryFn: async ({ pageParam = 0 }: QueryFunctionContext) => {
      // Construct the URL with query parameters
      const url = new URL(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/property/${params.property_id}/rate-calendar/assessment`
      );

      url.search = new URLSearchParams({
        start_date: params.start_date,
        end_date: params.end_date,
        cursor: pageParam.toString(), // Use cursor for pagination
      }).toString();

      // Fetch data from the API
      const result = await Fetch<IResponse>({
        method: "GET",
        url,
      });

      // Check if the response data is valid
      if (!result.data || !result.data.room_categories) {
        throw new Error("Invalid API response: Missing room_categories");
      }

      // Return the data directly (unwrap the IResult<T>)
      return result.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor, // Fetch next page using nextCursor
    initialPageParam: 0, // Start with cursor 0
  });
}
