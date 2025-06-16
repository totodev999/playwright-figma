import { ReactNode, useState } from 'react';
import React from 'react';
import { Link, useNavigate } from 'react-router';

const histories = [
  {
    name: 'DashboardDashboardDashboardDashboardDashboardDashboardDashboard',
    href: '/',
  },
  { name: 'Dashboard', href: '/' },
  { name: 'Dashboard', href: '/' },
];

export const Layout = ({ children }: { children: ReactNode }) => {
  const navigator = useNavigate();
  return (
    <div>
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
        <div className="flex grow flex-col gap-y-5 bg-gray-900 px-6 pt-6">
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <div>
                <p className="text-white font-bold">History</p>
              </div>
              <li className="max-h-[80vh] overflow-y-scroll">
                <ul role="list" className="space-y-1 divide-y divide-white">
                  {histories.map((item) => (
                    <li key={item.href}>
                      <Link to={item.href}>
                        <p className="text-white text-center text-wrap break-words">
                          {item.name}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <button
              onClick={() => {
                navigator('/chat');
                navigator(0);
              }}
              className="text-white w-full h-14 grid place-content-center border border-white "
            >
              New chat
            </button>
            <Link
              to="/html-to-figma"
              className="text-white w-full h-14 grid place-content-center border border-white "
            >
              HTML to Figma
            </Link>
          </nav>
        </div>
      </div>

      {/* main avoid sidebar area */}
      <main className="pl-72">
        <div className="">{children}</div>
      </main>
    </div>
  );
};
