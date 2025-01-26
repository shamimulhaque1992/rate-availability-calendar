import { Box, Grid2 as Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  VariableSizeGrid,
  areEqual,
  GridChildComponentProps,
  GridOnScrollProps,
} from "react-window";
import { memo, RefObject, useMemo, useRef, useEffect } from "react";
import { styled } from "@mui/material/styles";
import RoomRateCell from "./RateCell";
import RoomRateRestrictionsCell from "./RestrictionsCell";
import {
  IRateCalendar,
  IRoomCategoryCalender,
  IRoomInventory,
} from "../(hooks)/useRoomRateAvailabilityCalendar";
import { Person } from "@mui/icons-material";
import { useInfiniteQuery } from "@tanstack/react-query";
import RoomInventoryStatusCell from "./StatusCell";

// Define the props for the RoomRateAvailabilityCalendar component
interface IProps {
  InventoryRefs: RefObject<Array<RefObject<VariableSizeGrid | null>>>;
  handleCalenderScroll: ({ scrollLeft }: GridOnScrollProps) => void;
  index: number;
  isLastElement: boolean;
  room_category: IRoomCategoryCalender;
  property_id: number;
  start_date: string;
  end_date: string;
}

// Define the data structure for the grid
interface IGridData {
  type: string;
  row: string;
  rate_plan?: {
    id: number;
    name: string;
    calendar: IRateCalendar[];
  };
}

// Component to render the room rate availability calendar
export default function RoomRateAvailabilityCalendar(props: IProps) {
  const theme = useTheme(); // Get the theme for styling
  const InventoryRef = useRef<VariableSizeGrid | null>(null);

  // Store the ref in the InventoryRefs array
  props.InventoryRefs.current[props.index] = InventoryRef;

  // Fetch data using infinite query
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [
      "property_room_calendar",
      props.property_id,
      props.start_date,
      props.end_date,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/property/${props.property_id}/rate-calendar/assessment`
      );
      url.search = new URLSearchParams({
        start_date: props.start_date,
        end_date: props.end_date,
        cursor: pageParam.toString(),
      }).toString();

      const response = await fetch(url.toString());
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // Load more data when the user scrolls to the bottom
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Memoize the grid data to avoid unnecessary re-renders
  const calendarGridData = useMemo(() => {
    const data: Array<IGridData> = [
      { type: "inventory", row: "status" },
      { type: "inventory", row: "available" },
      { type: "inventory", row: "booked" },
      ...props.room_category.rate_plans.flatMap((ratePlan) => [
        { type: "rate_calendar", row: "rate", rate_plan: ratePlan },
        {
          type: "rate_calendar",
          row: "min_length_of_stay",
          rate_plan: ratePlan,
        },
        {
          type: "rate_calendar",
          row: "reservation_deadline",
          rate_plan: ratePlan,
        },
      ]),
    ];

    return data;
  }, [props.room_category.rate_plans]);

  // Component to render each cell in the grid
  const RateCalendarGrid: React.FC<GridChildComponentProps> = memo(
    function RateCalendarGridFC({ columnIndex, rowIndex, style, data }) {
      const {
        rowData,
        inventoryData,
      }: { rowData: Array<IGridData>; inventoryData: Array<IRoomInventory> } =
        data;

      if (rowData[rowIndex].type === "inventory") {
        const inventory = inventoryData[columnIndex];

        if (rowData[rowIndex].row === "status") {
          return (
            <Box style={style}>
              <RoomInventoryStatusCell
                inventory={inventory}
                room_category={{
                  id: props.room_category.id,
                  name: props.room_category.name,
                }}
              />
            </Box>
          );
        } else if (rowData[rowIndex].row === "available") {
          return (
            <Box style={style}>
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  pr: 1,
                  fontSize: "12px",
                  fontWeight: "bold",
                  borderLeft: "1px solid",
                  borderBottom: "1px solid",
                  borderColor: inventory.status
                    ? theme.palette.divider
                    : theme.palette.error.dark,
                  color: inventory.status
                    ? "inherit"
                    : theme.palette.background.default,
                  backgroundColor: inventory.status
                    ? "inherit"
                    : theme.palette.error.light,
                }}
              >
                {inventory.available}
              </Box>
            </Box>
          );
        } else {
          return (
            <Box style={style}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  width: "100%",
                  height: "100%",
                  pr: 1,
                  fontSize: "12px",
                  fontWeight: 600,
                  borderLeft: "1px solid",
                  borderBottom: "1px solid",
                  borderColor: inventory.status
                    ? theme.palette.divider
                    : theme.palette.error.dark,
                  color: inventory.status
                    ? "inherit"
                    : theme.palette.background.default,
                  backgroundColor: inventory.status
                    ? "inherit"
                    : theme.palette.error.light,
                }}
              >
                {inventory.booked}
              </Box>
            </Box>
          );
        }
      } else {
        const rate_plan = {
          id: rowData[rowIndex].rate_plan!.id,
          name: rowData[rowIndex].rate_plan!.name,
        };
        const inventory = inventoryData[columnIndex];
        const rate_calendar =
          rowData[rowIndex].rate_plan!.calendar[columnIndex];

        if (rowData[rowIndex].row === "rate") {
          return (
            <Box style={style}>
              <RoomRateCell
                room_category={{
                  id: props.room_category.id,
                  name: props.room_category.name,
                }}
                rate_plan={rate_plan}
                room_rate={rate_calendar}
                inventory={inventory}
              />
            </Box>
          );
        } else if (rowData[rowIndex].row === "min_length_of_stay") {
          return (
            <Box style={style}>
              <RoomRateRestrictionsCell
                type="min_length_of_stay"
                room_category={props.room_category}
                rate_plan={rate_plan}
                room_rate={rate_calendar}
                inventory={inventory}
              />
            </Box>
          );
        } else {
          return (
            <Box style={style}>
              <RoomRateRestrictionsCell
                type="reservation_deadline"
                room_category={props.room_category}
                rate_plan={rate_plan}
                room_rate={rate_calendar}
                inventory={inventory}
              />
            </Box>
          );
        }
      }
    },
    areEqual
  );

  // Style the VariableSizeGrid to hide the scrollbar if it's not the last element
  const StyledVariableSizeGrid = styled(VariableSizeGrid)(
    props.isLastElement
      ? {}
      : {
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }
  );

  return (
    <>
      <Grid container sx={{ py: 4, px: 4 }}>
        <Grid size={10}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 700,
            }}
          >
            {props.room_category.name}
          </Typography>
        </Grid>
        <Grid size={2}></Grid>
      </Grid>
      <Grid
        container
        sx={{
          height: props.isLastElement
            ? 90 + props.room_category.rate_plans.length * 120 + 10
            : 90 + props.room_category.rate_plans.length * 120,
        }}
      >
        <Grid
          sx={{
            pl: 4,
            fontSize: "12px",
            fontWeight: 500,
          }}
          container
          size={{
            xs: 4,
            sm: 4,
            md: 3,
            lg: 2,
            xl: 2,
          }}
        >
          <Grid
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              height: 30,
              borderBottom: "1px solid",
              borderColor: theme.palette.divider,
            }}
            size={12}
          >
            Room status
          </Grid>
          <Grid
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              height: 30,
              borderBottom: "1px solid",
              borderColor: theme.palette.divider,
            }}
            size={12}
          >
            Rooms to sell
          </Grid>
          <Grid
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              height: 30,
              borderBottom: "1px solid",
              borderColor: theme.palette.divider,
            }}
            size={12}
          >
            Net booked
          </Grid>
          {props.room_category.rate_plans.map((rate_plan, key) => (
            <>
              <Grid
                key={key}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  flexDirection: "column",
                  height: 60,
                  borderBottom: "1px solid",
                  borderColor: theme.palette.divider,
                }}
                size={12}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {rate_plan.name}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Person fontSize="small" />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      ml: 0.5,
                    }}
                  >
                    {props.room_category.occupancy}
                  </Typography>
                </Box>
              </Grid>
              <Grid
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  height: 30,
                  borderBottom: "1px solid",
                  borderColor: theme.palette.divider,
                }}
                size={12}
              >
                Min. length of stay
              </Grid>
              <Grid
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  height: 30,
                  borderBottom: "1px solid",
                  borderColor: theme.palette.divider,
                }}
                size={12}
              >
                Min. advance reservation
              </Grid>
            </>
          ))}
        </Grid>

        <Grid
          container
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
              <StyledVariableSizeGrid
                height={height}
                width={width}
                columnCount={props.room_category.inventory_calendar.length}
                columnWidth={() => 74}
                rowCount={calendarGridData.length}
                rowHeight={(index: number) => {
                  if (calendarGridData[index].type === "inventory") {
                    return 30;
                  } else {
                    if (calendarGridData[index].row === "rate") {
                      return 60;
                    } else {
                      return 30;
                    }
                  }
                }}
                onScroll={props.handleCalenderScroll}
                ref={InventoryRef}
                itemData={{
                  rowData: calendarGridData,
                  inventoryData: props.room_category.inventory_calendar,
                }}
              >
                {RateCalendarGrid}
              </StyledVariableSizeGrid>
            )}
          </AutoSizer>
        </Grid>
      </Grid>
      <div ref={loadMoreRef} style={{ height: "20px" }}>
        {isFetchingNextPage && "Loading more..."}
      </div>
    </>
  );
}
