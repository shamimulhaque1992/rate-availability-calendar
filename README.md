# Project Documentation

## Overview

This project is part of the Grit System Technical Assessment for Front-End Engineers. The main objective is to enhance the calendar component by implementing infinite scrolling using a cursor query parameter in the `useRoomRateAvailabilityCalendar` query. Additionally, the candidate will optimize the horizontal scroll behavior of the calendar to ensure smooth and responsive navigation.

### Existing Code and Behavior

The existing codebase includes a calendar component that displays room rate availability data for a specified date range. The data is fetched using the `useRoomRateAvailabilityCalendar` hook, which retrieves the data from an API endpoint. The calendar component supports horizontal scrolling to navigate through the dates.

### Goal for the Candidate

The candidate is required to:

1. Implement infinite scrolling for the calendar component by converting the `useRoomRateAvailabilityCalendar` query to use infinite queries with a cursor query parameter.
2. Optimize the horizontal scroll behavior of the calendar to ensure smooth and responsive scrolling.
3. Update the project documentation to reflect the changes made.

## Rate Calendar API Documentation

### Base URL

`https://beta.api.bytebeds.com`

### Endpoint

`GET /api/v1/property/{property_id}/rate-calendar/assessment`

### Query Parameters

- `property_id` (number): The ID of the property.
- `start_date` (string): The start date for the calendar data in YYYY-MM-DD format.
- `end_date` (string): The end date for the calendar data in YYYY-MM-DD format.
- `cursor` (number, optional): The cursor for pagination, used for infinite scrolling.

### Response

The response contains the following structure:

```json
{
  "room_categories": [
    {
      "id": "string",
      "name": "string",
      "occupancy": "number",
      "inventory_calendar": [
        {
          "id": "string",
          "date": "string",
          "available": "number",
          "status": "boolean",
          "booked": "number"
        }
      ],
      "rate_plans": [
        {
          "id": "number",
          "name": "string",
          "calendar": [
            {
              "id": "string",
              "date": "string",
              "rate": "number",
              "min_length_of_stay": "number",
              "reservation_deadline": "number"
            }
          ]
        }
      ]
    }
  ],
  "nextCursor": "number"
}
```

### Postman Collection

You can find a working Postman collection for this API [here](https://www.postman.com/blue-star-32935/workspace/grit-system/request/26020074-3b661363-f648-4233-9020-4a1264b0d9e7?action=share&creator=26020074&ctx=documentation).

## Instructions for the Candidate

1. **Setup the Project:**

   - Clone the repository from the provided URL.
   - Install the necessary dependencies using `npm install`.
   - Set up the environment variable `NEXT_PUBLIC_BACKEND_URL` with the base URL `https://beta.api.bytebeds.com`.
   - Ensure the project runs successfully by executing `npm start`.

2. **Implement Infinite Scrolling:**

   - Locate the `useRoomRateAvailabilityCalendar` query in the codebase.
   - Convert this query to use infinite queries with a `cursor` query parameter.
   - Ensure that the calendar component can load more data as the user scrolls vertically.

3. **Optimize Scroll Behavior:**

   - Analyze the current implementation of the calendar's horizontal scroll behavior.
   - Identify the causes of the laggy scroll performance.
   - Optimize the scroll behavior to ensure it is smooth and responsive.
   - Test the scroll performance on different devices and screen sizes to ensure consistency.

4. **Documentation:**

   - Update the project documentation to reflect the changes made.
   - Include any necessary instructions for future developers on how to maintain or extend the infinite scrolling functionality.

5. **Submission:**
   - Fork the repository and complete the assessment on your fork.
   - Commit your changes to a new branch and push it to your forked repository.
   - Host the project on Vercel/CodeSandbox and share the live link.
   - Share the link to your forked repository and the live link via email at mustakim@grit.com.bd.

**Deadline: 30 January 2025**

## Additional Notes

- Pay attention to code quality and follow best practices for React and JavaScript development.
- Consider edge cases and error handling to ensure a robust implementation.
- Feel free to reach out if you have any questions or need further clarification on the requirements.

Good luck, and we look forward to reviewing your implementation!

--------------------------------------------------------------------------

# Updated Documentation and Changelog by - Khandoker Shamimul Haque

## Calendar Infinite Scrolling and Optimization

This document provides a detailed overview of the changes made to the calendar functionality, focusing on infinite scrolling, performance improvements, and maintainability.

---

## Changes Made

### 1. Styling Enhancements
- **Added Performance Optimizations**:
  - Applied `willChange: "transform"` and `overflowAnchor: "none"` to the `StyledVariableSizeList` to improve rendering performance and prevent unwanted scroll anchoring behavior.

---

### 2. Scroll Animation Optimization
- **Smooth Scrolling**:
  - Introduced `scrollAnimationRef` using `useRef<number | null>(null)` to manage animations.
  - Replaced direct scroll updates with `requestAnimationFrame` in `handleDatesScroll` and `handleCalenderScroll` to reduce jank and enhance performance.
  - Implemented `cancelAnimationFrame` to cancel pending animations before starting new ones.

---

### 3. Infinite Query Implementation
- **Transition to Infinite Queries**:
  - Replaced `useQuery` with `useInfiniteQuery` from `@tanstack/react-query` to support pagination and infinite scrolling.
  - Set `initialPageParam` to `0` to start pagination from the first page.

- **Added `pageParam` Handling**:
  - Introduced `pageParam` in the `queryFn` to handle pagination logic.
  - Defaulted `pageParam` to `0` when undefined.
  - Derived the `cursor` from `pageParam` and converted it to a string for API compatibility.

- **Implemented `getNextPageParam`**:
  - Used `getNextPageParam` to fetch subsequent pages via the `nextCursor` returned by the API.

- **Updated Query Key**:
  - Modified the `queryKey` to include parameters for improved caching and refetching behavior.

---

### 4. Infinite Scroll Logic
- **IntersectionObserver Integration**:
  - Added infinite scrolling using `IntersectionObserver` to detect when users reach the bottom of the calendar.
  - Introduced `loadMoreRef` to trigger `fetchNextPage` when the last element becomes visible.

---

### 5. Pagination Handling for Room Categories
- **Dynamic Rendering**:
  - Updated the `room_calendar` rendering logic to map over paginated data using `room_calendar.data?.pages`.
  - Added unique composite keys (`${pageIndex}-${key}`) for `MemoizedRoomCalendar` components to improve reconciliation.
  - Adjusted `isLastElement` to determine if the current room category is the last element in the last page.

---

### 6. Memoization of Components
- **Improved Component Performance**:
  - Memoized `MonthRow` and `DateRow` components to prevent unnecessary re-renders.
  - Added `displayName` for better debugging in React DevTools.
  - Wrapped `RoomRateAvailabilityCalendar` in `memo` for similar performance gains.

---

### 7. Error Handling
- **API Response Validation**:
  - Added validation to ensure the API response contains the `room_categories` field.
  - Throws an error if the response is invalid to prevent unexpected runtime issues.

---

### Key Additions
1. **Scroll Animation**:
   - Enhanced user experience with smooth scrolling using `requestAnimationFrame`.

2. **Infinite Query**:
   - Supported pagination using `@tanstack/react-query`.

3. **Memoization**:
   - Improved performance by memoizing components.

4. **Error Handling**:
   - Validated API responses for robust error prevention.

---

## Instructions for Future Developers

### Maintaining Infinite Scrolling Functionality
1. **API Integration**:
   - Ensure the API returns a `nextCursor` field for pagination.
   - Update `getNextPageParam` logic if the API pagination format changes.

2. **Query Key Management**:
   - Update the `queryKey` if new parameters are introduced or existing ones are modified to ensure proper caching.

3. **IntersectionObserver**:
   - Adjust the `loadMoreRef` logic if the component structure changes.
   - Test the `fetchNextPage` trigger regularly to confirm seamless data loading.

4. **Error Handling**:
   - Enhance validation logic if the API introduces new fields or changes response structure.

---

### Extending Infinite Scrolling
1. **Add Loading Indicators**:
   - Introduce spinners or skeleton loaders to indicate data fetching during scrolling.

2. **Dynamic Threshold**:
   - Adjust the `IntersectionObserver` threshold for different datasets or use cases.

3. **Scroll Position Persistence**:
   - Preserve the user's scroll position when navigating away and returning to the calendar.

4. **Testing**:
   - Write unit tests to cover:
     - `fetchNextPage` functionality.
     - `IntersectionObserver` triggering logic.
     - Validation for `room_categories` in API responses.

5. **Batching Requests**:
   - If performance becomes an issue, implement batching to prefetch multiple pages.

---

## Example Usage

Below is an example of the infinite scrolling setup with `useInfiniteQuery`:

```typescript
const fetchRoomCalendar = async ({ pageParam = 0 }) => {
  const response = await fetch(`/api/room-calendar?cursor=${pageParam}`);
  const data = await response.json();

  if (!data.room_categories) {
    throw new Error('Invalid API response: room_categories field is missing');
  }

  return data;
};

const useRoomCalendar = () => {
  return useInfiniteQuery({
    queryKey: ['roomCalendar'],
    queryFn: fetchRoomCalendar,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};

const CalendarComponent = () => {
  const { data, fetchNextPage, hasNextPage } = useRoomCalendar();

  return (
    <div>
      {data?.pages.map((page, pageIndex) =>
        page.room_categories.map((category, key) => (
          <MemoizedRoomCalendar key={`${pageIndex}-${key}`} {...category} />
        ))
      )}
      <div ref={loadMoreRef} />
    </div>
  );
};
```