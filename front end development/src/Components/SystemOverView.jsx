const SystemOverview = () => {
  const systems = [
    {
      name: "Database",
      status: "Online",
      color: "bg-green-500",
    },
    {
      name: "API Server",
      status: "Running",
      color: "bg-blue-500",
    },
    {
      name: "Authentication",
      status: "Secure",
      color: "bg-indigo-500",
    },
    {
      name: "Backup Service",
      status: "Active",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

      <h2 className="text-xl font-bold mb-6">
        System Overview
      </h2>

      <div className="space-y-4">

        {systems.map((system, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
          >
            <span className="font-medium">
              {system.name}
            </span>

            <span
              className={`px-3 py-1 text-white rounded-full text-sm ${system.color}`}
            >
              {system.status}
            </span>
          </div>
        ))}

      </div>
    </div>
  );
};

export default SystemOverview;