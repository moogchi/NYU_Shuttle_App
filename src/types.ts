export type StopSchedule = {
  stop: string;
  times: string[];
};

export type Route = {
  id: string;
  name: string;
  stops: string[];
  availableDays: string[];
  schedules: {
    "Mon-Thu"?: StopSchedule[];
    Fri?: StopSchedule[];
    Weekend?: StopSchedule[];
  };
};
