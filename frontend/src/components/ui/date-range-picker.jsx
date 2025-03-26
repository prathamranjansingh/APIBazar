import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

export function DatePickerWithRange({ value, onChange, className }) {
  const [date, setDate] = React.useState(value);
  const [preset, setPreset] = React.useState("custom");

  React.useEffect(() => {
    if (value?.from && value?.to) {
      setDate({ from: value.from, to: value.to });
    }
  }, [value]);

  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    const today = new Date();
    let newRange;

    switch (newPreset) {
      case "today":
        newRange = {
          from: today,
          to: today
        };
        break;
      case "yesterday":
        const yesterday = addDays(today, -1);
        newRange = {
          from: yesterday,
          to: yesterday
        };
        break;
      case "7days":
        newRange = {
          from: addDays(today, -7),
          to: today
        };
        break;
      case "30days":
        newRange = {
          from: addDays(today, -30),
          to: today
        };
        break;
      case "90days":
        newRange = {
          from: addDays(today, -90),
          to: today
        };
        break;
      default:
        return;
    }

    setDate(newRange);
    onChange?.(newRange);
  };

  const handleDateRangeChange = (range) => {
    if (range?.from && range?.to) {
      setDate(range);
      setPreset("custom");
      onChange?.(range);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            className={cn(
              "justify-start text-left w-[240px] md:w-[300px] font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, yyyy")} -{" "}
                  {format(date.to, "LLL dd, yyyy")}
                </>
              ) : (
                format(date.from, "LLL dd, yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="border-b p-3">
            <div className="flex items-center gap-2">
              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Range</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}