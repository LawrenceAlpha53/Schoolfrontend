import {
  CalendarDays,
  Bell,
  GraduationCap,
} from "lucide-react";

const UpcomingEvents = () => {
  const events = [
    {
      title: "Mid-Term Exams",
      date: "15 Sept 2026",
    },
    {
      title: "Parents Meeting",
      date: "20 Sept 2026",
    },
    {
      title: "Fee Deadline",
      date: "30 Sept 2026",
    },
    {
      title: "Graduation Ceremony",
      date: "15 Dec 2026",
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

      <div className="flex items-center gap-2 mb-6">
        <CalendarDays size={22} />
        <h2 className="text-xl font-bold">
          Upcoming Events
        </h2>
      </div>

      <div className="space-y-4">

        {events.map((event, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
          >
            <Bell className="text-blue-600" />

            <div>
              <h3 className="font-semibold">
                {event.title}
              </h3>

              <p className="text-sm text-slate-500">
                {event.date}
              </p>
            </div>
          </div>
        ))}

      </div>

    </div>
  );
};

export default UpcomingEvents;