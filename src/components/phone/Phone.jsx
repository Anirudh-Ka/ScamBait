import { useEffect, useState } from 'react';
import { Signal, Wifi, BatteryFull } from 'lucide-react';

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return <span className="tabular">{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '')}</span>;
}

export default function Phone({ children, label }) {
  return (
    <section
      aria-label={label}
      className="relative mx-auto w-full max-w-[400px] h-[min(780px,calc(100dvh-8.5rem))] min-h-[580px] rounded-[40px] sm:rounded-[46px] bg-abyss p-[7px] sm:p-[10px] shadow-[0_40px_80px_-40px_rgba(14,42,51,0.7)]"
    >
      <div className="relative h-full w-full rounded-[34px] sm:rounded-[37px] bg-shell overflow-hidden flex flex-col isolate">
        <div className="shrink-0 h-11 px-7 flex items-center justify-between text-[0.85rem] font-semibold text-abyss" aria-hidden="true">
          <Clock />
          <span className="absolute left-1/2 -translate-x-1/2 top-2.5 w-24 h-6 rounded-full bg-abyss" />
          <span className="flex items-center gap-1.5">
            <Signal size={15} />
            <Wifi size={15} />
            <BatteryFull size={18} />
          </span>
        </div>
        <div className="relative flex-1 min-h-0 flex flex-col">{children}</div>
      </div>
    </section>
  );
}
