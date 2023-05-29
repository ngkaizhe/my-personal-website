import Link from "next/link";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="box-border m-0 p-0">
      <header className="bg-black flex justify-between align-baseline px-8 py-[10%]">
        <nav>
          <ul>
            <li className="text-base text-slate-200">
              <Link href="#">Nav1 link</Link>
            </li>
            <li className="text-base text-slate-200">
              <Link href="#">Nav2 link</Link>
            </li>
            <li className="text-base text-slate-200">
              <Link href="#">Nav3 link</Link>
            </li>
          </ul>
        </nav>
        <Link href="#">
          <button className="text-base text-slate-200">Contact</button>
        </Link>
      </header>
      {children}
    </div>
  );
};

export default DashboardLayout;
