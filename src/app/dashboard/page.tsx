"use client";

import Link from "next/link";

export default function Page() {
  return (
    <h1 className="title">
      Read <Link href="/">Some main content</Link>
    </h1>
  );
}
