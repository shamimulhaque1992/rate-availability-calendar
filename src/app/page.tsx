"use client";

// Import necessary modules and components
import {
  Grid2 as Grid,
  Typography,
  Card,
  Box,
  Container,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DateRange } from "@mui/x-date-pickers-pro";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { SingleInputDateRangeField } from "@mui/x-date-pickers-pro/SingleInputDateRangeField";
import { Controller, useForm } from "react-hook-form";
import {
  RefObject,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  VariableSizeList,
  ListChildComponentProps,
  areEqual,
  FixedSizeGrid,
  GridChildComponentProps,
  VariableSizeGrid,
  GridOnScrollProps,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import { countDaysByMonth } from "@/utils";
import RoomRateAvailabilityCalendar from "./(components)/RoomCalendar";
import Navbar from "@/components/Navbar";
import useRoomRateAvailabilityCalendar from "./(hooks)/useRoomRateAvailabilityCalendar";

// Define the form type for the date range picker
export type CalendarForm = {
  date_range: DateRange<dayjs.Dayjs>;
};

// Style the VariableSizeList to hide the scrollbar
const StyledVariableSizeList = styled(VariableSizeList)({
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": {
    display: "none",
  },
  willChange: "transform",
  overflowAnchor: "none",
});

export default function Page() {
  const theme = useTheme(); // Get the theme for styling

  const propertyId = 1; // Example property ID

  // Refs for various elements to handle scrolling
  const rootContainerRef = useRef<HTMLDivElement>(null);
  const calenderMonthsRef = useRef<VariableSizeList | null>(null);
  const calenderDatesRef = useRef<FixedSizeGrid | null>(null);
  const mainGridContainerRef = useRef<HTMLDivElement | null>(null);
  const InventoryRefs = useRef<Array<RefObject<VariableSizeGrid>>>([]);
  const scrollAnimationRef = useRef<number | null>(null);
  // Handle horizontal scroll for dates
  const handleDatesScroll = useCallback(({ scrollLeft }: GridOnScrollProps) => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    scrollAnimationRef.current = requestAnimationFrame(() => {
      InventoryRefs.current.forEach((ref) => {
        ref.current?.scrollTo({ scrollLeft });
      });
      calenderMonthsRef.current?.scrollTo(scrollLeft);
    });
  }, []);

  // Handle horizontal scroll for the entire calendar
  const handleCalenderScroll = useCallback(
    ({ scrollLeft }: GridOnScrollProps) => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
      scrollAnimationRef.current = requestAnimationFrame(() => {
        InventoryRefs.current.forEach((ref) => {
          ref.current?.scrollTo({ scrollLeft });
        });
        calenderMonthsRef.current?.scrollTo(scrollLeft);
        calenderDatesRef.current?.scrollTo({ scrollLeft });
      });
    },
    []
  );

  // Add event listener for wheel scroll to handle horizontal scrolling
  useEffect(() => {
    const { current: rootContainer } = rootContainerRef;
    if (rootContainer) {
      const handler = (e: WheelEvent) => {
        if (e.deltaX !== 0 && mainGridContainerRef.current) {
          e.preventDefault();
          const scrollLeft = mainGridContainerRef.current.scrollLeft + e.deltaX;

          if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current);
          }
          scrollAnimationRef.current = requestAnimationFrame(() => {
            InventoryRefs.current.forEach((ref) => {
              ref.current?.scrollTo({ scrollLeft });
            });
            calenderMonthsRef.current?.scrollTo(scrollLeft);
            calenderDatesRef.current?.scrollTo({ scrollLeft });
          });
        }
      };
      rootContainer.addEventListener("wheel", handler, { passive: false });
      return () => rootContainer.removeEventListener("wheel", handler);
    }
  }, []);

  // State for calendar dates and months
  const [calenderDates, setCalenderDates] = useState<Array<dayjs.Dayjs>>([]);
  const [calenderMonths, setCalenderMonths] = useState<Array<[string, number]>>(
    []
  );

  // Form control for date range picker
  const { control, watch } = useForm<CalendarForm>({
    defaultValues: {
      date_range: [dayjs(), dayjs().add(4, "month")],
    },
  });
  const watchedDateRange = watch("date_range");

  // Update calendar dates and months when the date range changes
  useEffect(() => {
    const { months, dates } = countDaysByMonth(
      watchedDateRange[0]!,
      watchedDateRange[1]
        ? watchedDateRange[1]
        : watchedDateRange[0]!.add(2, "month")
    );

    setCalenderMonths(months);
    setCalenderDates(dates);
  }, [watchedDateRange]);

  // Fetch room rate availability calendar data
  const room_calendar = useRoomRateAvailabilityCalendar({
    property_id: propertyId,
    start_date: watchedDateRange[0]!.format("YYYY-MM-DD"),
    end_date: (watchedDateRange[1]
      ? watchedDateRange[1]
      : watchedDateRange[0]!.add(2, "month")
    ).format("YYYY-MM-DD"),
  });

  // Component to render each month row in the calendar
  const MonthRow = memo(
    ({ index, style }: ListChildComponentProps) => (
      <Box style={style}>
        <Box
          sx={{
            px: 1,
            fontSize: "12px",
            fontWeight: "bold",
            borderLeft: "1px solid",
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
        >
          <Box component="span" sx={{ position: "sticky", left: 2, zIndex: 1 }}>
            {calenderMonths[index][0]}
          </Box>
        </Box>
      </Box>
    ),
    areEqual
  );
  MonthRow.displayName = "MonthRow";

  // Component to render each date row in the calendar
  const DateRow = memo(
    ({ columnIndex, style }: GridChildComponentProps) => (
      <Box style={style}>
        <Box
          sx={{
            pr: 1,
            fontSize: "12px",
            textAlign: "right",
            fontWeight: "bold",
            borderLeft: "1px solid",
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
        >
          <div>{calenderDates[columnIndex].format("ddd")}</div>
          <div>{calenderDates[columnIndex].format("DD")}</div>
        </Box>
      </Box>
    ),
    areEqual
  );
  DateRow.displayName = "DateRow";

  // Infinite scroll logic
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          room_calendar.hasNextPage &&
          !room_calendar.isFetchingNextPage
        ) {
          room_calendar.fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [
    room_calendar.hasNextPage,
    room_calendar.isFetchingNextPage,
    room_calendar.fetchNextPage,
  ]);
  const MemoizedRoomCalendar = memo(RoomRateAvailabilityCalendar);
  return (
    <Container sx={{ backgroundColor: "#EEF2F6" }}>
      <Navbar />
      <Box>
        <Card elevation={1} sx={{ padding: 4, mt: 4 }}>
          <Grid container columnSpacing={2}>
            <Grid size={12}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  mb: 0,
                }}
              >
                Rate Calendar
              </Typography>
            </Grid>

            <Grid size={4}>
              <Controller
                name="date_range"
                control={control}
                rules={{
                  required: "Please specify a date range.",
                }}
                render={({ field, fieldState: { invalid, error } }) => (
                  <DateRangePicker
                    {...field}
                    autoFocus
                    minDate={dayjs()}
                    maxDate={dayjs().add(2, "year")}
                    slots={{ field: SingleInputDateRangeField }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: invalid,
                        helperText: invalid ? error?.message : null,
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Card>
        <Card elevation={1} sx={{ my: 6, padding: 3 }} ref={rootContainerRef}>
          <Grid container columnSpacing={2}>
            <Grid
              size={{
                xs: 4,
                sm: 4,
                md: 3,
                lg: 2,
                xl: 2,
              }}
            ></Grid>

            <Grid
              size={{
                xs: 8,
                sm: 8,
                md: 9,
                lg: 10,
                xl: 10,
              }}
            >
              <AutoSizer disableHeight>
                {({ width }) => (
                  <StyledVariableSizeList
                    height={19}
                    width={width}
                    itemCount={calenderMonths?.length}
                    itemSize={(index: number) => {
                      const no_of_days = calenderMonths[index][1];
                      return no_of_days * 74;
                    }}
                    layout="horizontal"
                    ref={calenderMonthsRef}
                    itemData={{ months: calenderMonths, theme }}
                  >
                    {MonthRow}
                  </StyledVariableSizeList>
                )}
              </AutoSizer>
            </Grid>
          </Grid>

          <Grid container sx={{ height: 48 }}>
            <Grid
              sx={{
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
              }}
              size={{
                xs: 4,
                sm: 4,
                md: 3,
                lg: 2,
                xl: 2,
              }}
            ></Grid>
            <Grid
              size={{
                xs: 8,
                sm: 8,
                md: 9,
                lg: 10,
                xl: 10,
              }}
            >
              <AutoSizer>
                {({ height, width }) => (
                  <FixedSizeGrid
                    height={height}
                    width={width}
                    columnCount={calenderDates?.length}
                    columnWidth={74}
                    rowCount={1}
                    rowHeight={37}
                    ref={calenderDatesRef}
                    outerRef={mainGridContainerRef}
                    onScroll={handleDatesScroll}
                  >
                    {DateRow}
                  </FixedSizeGrid>
                )}
              </AutoSizer>
            </Grid>
          </Grid>

          {room_calendar.isSuccess
            ? room_calendar.data?.pages?.map((page, pageIndex) =>
                page.room_categories.map((room_category, key) => (
                  <MemoizedRoomCalendar
                    key={`${pageIndex}-${key}`}
                    index={key}
                    InventoryRefs={InventoryRefs}
                    isLastElement={
                      pageIndex === room_calendar.data.pages.length - 1 &&
                      key === page.room_categories.length - 1
                    }
                    room_category={room_category}
                    handleCalenderScroll={handleCalenderScroll}
                    property_id={propertyId}
                    start_date={watchedDateRange[0]!.format("YYYY-MM-DD")}
                    end_date={(watchedDateRange[1]
                      ? watchedDateRange[1]
                      : watchedDateRange[0]!.add(2, "month")
                    ).format("YYYY-MM-DD")}
                  />
                ))
              )
            : null}
          {room_calendar.isLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <div ref={loadMoreRef} style={{ height: "20px" }}>
            {room_calendar.isFetchingNextPage && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  width: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            )}
          </div>
        </Card>
      </Box>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          textAlign: "center",
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Grit System. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
}
