"use client";

import Link from "next/link";
import styled from "styled-components";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <DivWrapper>
      <nav>
        <ul>
          <li>
            <Link href="#">Nav1 link</Link>
            <Link href="#">Nav2 link</Link>
            <Link href="#">Nav3 link</Link>
          </li>
        </ul>
      </nav>
      {children}
    </DivWrapper>
  );
};

const DivWrapper = styled.div`
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  background-color: black;
`;

export default DashboardLayout;