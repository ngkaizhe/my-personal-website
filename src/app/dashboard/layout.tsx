"use client";

import Link from "next/link";
import styled from "styled-components";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <StyledDiv>
      <StyledHeader>
        <nav>
          <ul>
            <li>
              <Link href="#">Nav1 link</Link>
            </li>
            <li>
              <Link href="#">Nav2 link</Link>
            </li>
            <li>
              <Link href="#">Nav3 link</Link>
            </li>
          </ul>
        </nav>
        <Link href="#">
          <button>Contact</button>
        </Link>
      </StyledHeader>
      {children}
    </StyledDiv>
  );
};

const StyledDiv = styled.div`
  box-sizing: border-box;
  margin: 0;
  padding: 0;

  li,
  a,
  button {
    font-size: 16px;
    color: #edf0f1;
    text-decoration: none;
  }
`;

const StyledHeader = styled.header`
  background-color: black;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 10%;
`;

export default DashboardLayout;
