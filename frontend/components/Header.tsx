'use client';

import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary-600">
          EXELIX
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
