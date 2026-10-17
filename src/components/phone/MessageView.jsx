import { useEffect, useState } from 'react';
import { ChevronLeft, Volume2, Square, Flag, ShieldCheck, MessageCircle, PhoneCall, Play } from 'lucide-react';
import Highlighted from './Highlighted.jsx';
import ChannelIcon, { CHANNEL_LABEL } from './ChannelIcon.jsx';
import { VERDICTS, money, voiceFor } from '../../lib/game.js';
import { speak, stopSpeech } from '../../lib/speech.js';
import { useSettings } from '../../lib/settings.jsx';

export function marksFor(message, revealed) {
  if (!revealed) return [];
  return message.isScam
    ? (message.redFlags || []).map((f, i) => ({ quote: f.quote, kind: 'flag', index: i }))
    : (message.legitSigns || []).map((f, i) => ({ quote: f.quote, kind: 'legit', index: i }));
}

function Verdict({ result, onBack, onWhy }) {
  const v = VERDICTS[result.outcome];
  const tone = v.tone === 'bad' ? 'bg-bobber text-shell' : v.tone === 'good' ? 'bg-kelp text-shell' : 'bg-foam-deep text-abyss';
  return (
    <div className={`shrink-0 px-4 pt-3 pb-4 ${tone}`} role="status">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold text-[1.05rem]">{v.title}</p>
        <p className="tabular font-semibold">{result.lost > 0 ? `-${money(result.lost)}` : `+${result.points} pts`}</p>
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={onBack} className="flex-1 h-11 rounded-full bg-shell text-abyss font-bold">
          Back to inbox
        </button>
        <button onClick={onWhy} className="lg:hidden h-11 px-4 rounded-full border-2 border-current font-bold">
          Why?
        </button>
      </div>
    </div>
  );
}

export default function MessageView({ message, result, language, activeFlag, onActivateFlag, onBack, onReport, onTrust, onReply, onWhy }) {
  const { settings } = useSettings();
  const [speaking, setSpeaking] = useState(false);
  const revealed = Boolean(result);
  const marks = marksFor(message, revealed);
  const isVoicemail = message.channel === 'call';
  const bubble = message.channel === 'sms' || message.channel === 'dm';

  const spokenText = isVoicemail ? message.body : `${message.sender.name}. ${message.subject ? message.subject + '. ' : ''}${message.body}`;

  function toggleListen() {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(spokenText, { voice: isVoicemail ? voiceFor(message) : 'narrator', language, onEnd: () => setSpeaking(false) });
  }

  useEffect(() => {
    if (settings.readAloud && !revealed) toggleListen();
    return () => stopSpeech();
  }, [message.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 h-12 px-2 flex items-center justify-between border-b border-line">
        <button onClick={onBack} className="h-10 pl-1 pr-3 inline-flex items-center gap-0.5 rounded-full text-kelp font-semibold hover:bg-foam">
          <ChevronLeft size={22} aria-hidden="true" /> Inbox
        </button>
        {!isVoicemail && (
          <button onClick={toggleListen} className="h-10 px-3 inline-flex items-center gap-1.5 rounded-full hover:bg-foam text-abyss-soft" aria-pressed={speaking}>
            {speaking ? <Square size={16} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
            <span className="text-sm font-semibold">{speaking ? 'Stop' : 'Listen'}</span>
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-12 h-12 rounded-full bg-foam-deep grid place-items-center">
            <ChannelIcon channel={message.channel} voicemail size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-[1.1rem] leading-tight break-words">
              <Highlighted text={message.sender.name} marks={marks} active={activeFlag} onActivate={onActivateFlag} />
            </h2>
            <p className="text-sm text-abyss-soft break-words">
              <Highlighted text={message.sender.handle || ''} marks={marks} active={activeFlag} onActivate={onActivateFlag} />
            </p>
          </div>
        </div>
        <p className="mt-3 text-[0.8rem] text-abyss-soft">
          {isVoicemail ? 'Voicemail' : CHANNEL_LABEL[message.channel]}, today at {message.time}
        </p>

        {message.subject && (
          <h3 className="mt-3 text-[1.08rem] font-bold leading-snug">
            <Highlighted text={message.subject} marks={marks} active={activeFlag} onActivate={onActivateFlag} />
          </h3>
        )}

        {isVoicemail ? (
          <div className="mt-4">
            <button
              onClick={toggleListen}
              className="w-full flex items-center gap-3 rounded-2xl bg-abyss text-foam px-4 py-3"
              aria-pressed={speaking}
            >
              <span className="w-10 h-10 rounded-full bg-foam text-abyss grid place-items-center">
                {speaking ? <Square size={16} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              </span>
              <span className="font-semibold">{speaking ? 'Stop voicemail' : 'Play voicemail'}</span>
            </button>
            <p className="mt-4 text-sm font-semibold text-abyss-soft">Transcript</p>
            <p className="mt-1 text-[1rem] leading-relaxed">
              <Highlighted text={message.body} marks={marks} active={activeFlag} onActivate={onActivateFlag} />
            </p>
          </div>
        ) : bubble ? (
          <p className="mt-4 rounded-[20px] rounded-tl-md bg-foam-deep px-4 py-3 text-[1rem] leading-relaxed">
            <Highlighted text={message.body} marks={marks} active={activeFlag} onActivate={onActivateFlag} />
          </p>
        ) : (
          <p className="mt-4 text-[1rem] leading-relaxed">
            <Highlighted text={message.body} marks={marks} active={activeFlag} onActivate={onActivateFlag} />
          </p>
        )}

        {revealed && marks.length > 0 && (
          <p className="mt-5 text-sm text-abyss-soft">
            {message.isScam ? 'Highlighted: the red flags.' : 'Highlighted: the signs it was real.'} Tap one to see why.
          </p>
        )}
      </div>

      {revealed ? (
        <Verdict result={result} onBack={onBack} onWhy={onWhy} />
      ) : (
        <div className="shrink-0 border-t border-line p-3 grid grid-cols-3 gap-2 bg-shell">
          <button onClick={onReport} className="h-[3.6rem] rounded-2xl bg-bobber text-shell font-bold flex flex-col items-center justify-center leading-tight hover:brightness-110">
            <Flag size={18} aria-hidden="true" />
            <span className="text-[0.9rem]">Report scam</span>
          </button>
          <button onClick={onTrust} className="h-[3.6rem] rounded-2xl bg-kelp text-shell font-bold flex flex-col items-center justify-center leading-tight hover:brightness-110">
            <ShieldCheck size={18} aria-hidden="true" />
            <span className="text-[0.9rem]">Looks safe</span>
          </button>
          <button onClick={onReply} className="h-[3.6rem] rounded-2xl border-2 border-abyss text-abyss font-bold flex flex-col items-center justify-center leading-tight hover:bg-foam">
            {isVoicemail ? <PhoneCall size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}
            <span className="text-[0.9rem]">{isVoicemail ? 'Call back' : 'Reply'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
