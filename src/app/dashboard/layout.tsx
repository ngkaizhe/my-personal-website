import Link from "next/link";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="box-border m-0 p-0">
      <header
        className="
          sticky
          top-0 w-full"
      >
        <div
          className="
            bg-black
            flex justify-between items-center
            px-6 py-4
            rounded-bl-xl border-b-4 border-l-4 border-sky-600"
        >
          <div className="flex space-x-4">
            <Link
              href="#"
              className="
                text-base text-slate-200
                hover:bg-red-400 hover:text-red-800
                rounded-md
                p-5"
            >
              Nav1 link
            </Link>
            <Link
              href="#"
              className="
                text-base text-slate-200
                hover:bg-red-400 hover:text-red-800
                rounded-md
                p-5"
            >
              Nav2 link
            </Link>
            <p className="text-base text-slate-200 p-5">Coming Soon...</p>
          </div>
          <Link
            href="#"
            className="
              text-base text-slate-200
              hover:bg-green-400 hover:text-green-800
              px-5 py-3
              bg-gray-700
              rounded-3xl"
          >
            Logout
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
};

export default DashboardLayout;
