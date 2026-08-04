import { useTheme } from '../context/ThemeContext';

export function Logo() {
  const { theme } = useTheme();

  return (
    <div className="text-2xl font-bold flex items-center">
      <div className="logo rounded-full">
        <img
          src={theme === 'dark' ? '/White.svg' : '/Black.svg'}
          alt="EXELIX Logo"
          width={130}
          height={100}
        />
      </div>
    </div>
  );
}
