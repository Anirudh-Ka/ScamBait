import ChannelIcon, { CHANNEL_LABEL } from './ChannelIcon.jsx';
import { money } from '../../lib/game.js';

function Status({ result }) {
  if (!result) return null;
  const map = {
    caught: ['Reported', 'bg-kelp-light text-kelp'],
    trusted_legit: ['Trusted, real', 'bg-kelp-light text-kelp'],
    false_alarm: ['Reported, was real', 'bg-foam-deep text-abyss-soft'],
    fooled: [`Lost ${money(result.lost)}`, 'bg-bobber-light text-bobber'],
    paid: [`Lost ${money(result.lost)}`, 'bg-bobber-light text-bobber'],
  };
  const [text, cls] = map[result.outcome] || ['Done', 'bg-foam-deep'];
  return <span className={`inline-block mt-1.5 text-[0.78rem] font-bold px-2 py-0.5 rounded-full ${cls}`}>{text}</span>;
}

export default function Inbox({ persona, messages, results, onOpen, remaining }) {
  const first = persona.name.split(' ')[0];
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-5 pt-2 pb-3">
        <h2 className="text-[1.9rem] font-extrabold tracking-[-0.03em] leading-none">Inbox</h2>
        <p className="mt-1 text-sm text-abyss-soft">
          {first}'s phone. {remaining > 0 ? `${remaining} ${remaining === 1 ? 'message' : 'messages'} to check.` : 'All checked.'}
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto scroll-thin border-t border-line" aria-label="Messages">
        {messages.map((m) => {
          const r = results[m.id];
          const preview = m.channel === 'call' ? (r ? 'Phone call' : 'Missed call. Voicemail, tap to listen.') : m.subject || m.body;
          return (
            <li key={m.id} className="border-b border-line">
              <button
                onClick={() => onOpen(m.id)}
                className="w-full text-left px-4 py-3.5 flex gap-3 hover:bg-foam focus-visible:bg-foam"
                aria-label={`${CHANNEL_LABEL[m.channel]} from ${m.sender.name}, ${m.time}. ${r ? 'Done.' : 'Not checked yet.'}`}
              >
                <span className="relative shrink-0 w-11 h-11 rounded-full bg-foam-deep text-abyss grid place-items-center">
                  <ChannelIcon channel={m.channel} voicemail={!r} />
                  {!r && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-bobber-bright border-2 border-shell" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={`truncate ${r ? 'font-semibold text-abyss-soft' : 'font-bold'}`}>{m.sender.name}</span>
                    <span className="ml-auto shrink-0 text-[0.78rem] text-abyss-soft tabular">{m.time}</span>
                  </span>
                  <span className={`text-[0.9rem] leading-snug line-clamp-2 ${r ? 'text-abyss-soft' : ''}`}>{preview}</span>
                  <Status result={r} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
