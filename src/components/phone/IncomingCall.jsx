import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, Hand } from 'lucide-react';
import { speak, stopSpeech } from '../../lib/speech.js';
import { voiceFor } from '../../lib/game.js';

function useTimer(running) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setS((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function RoundButton({ onClick, label, children, tone, buttonRef }) {
  const cls = tone === 'red' ? 'bg-bobber-bright text-shell' : tone === 'green' ? 'bg-[#2f9a6e] text-shell' : 'bg-foam/15 text-foam';
  return (
    <button ref={buttonRef} onClick={onClick} className="flex flex-col items-center gap-2 group">
      <span className={`w-[4.3rem] h-[4.3rem] rounded-full grid place-items-center ${cls} group-hover:brightness-110 group-focus-visible:ring-4 group-focus-visible:ring-marker`}>{children}</span>
      <span className="text-sm font-semibold text-foam/90">{label}</span>
    </button>
  );
}

export default function IncomingCall({ message, stage, language, onAnswer, onDecline, onHangUp, onComply, onTalk }) {
  const [progress, setProgress] = useState(0);
  const [source, setSource] = useState('');
  const [done, setDone] = useState(false);
  const time = useTimer(stage === 'active');
  const answerRef = useRef(null);

  useEffect(() => {
    if (stage === 'ringing') answerRef.current?.focus({ preventScroll: true });
    if (stage !== 'active') return;
    setProgress(0);
    setDone(false);
    speak(message.body, {
      voice: voiceFor(message),
      language,
      onProgress: setProgress,
      onSource: setSource,
      onEnd: () => setDone(true),
    });
    return () => stopSpeech();
  }, [stage, message.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const words = message.body.split(/(\s+)/);
  const shown = Math.ceil(words.length * Math.min(1, progress + 0.04));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${stage === 'ringing' ? 'Incoming call' : 'Call'} from ${message.sender.name}`}
      className="absolute inset-0 z-40 flex flex-col text-foam bg-[radial-gradient(120%_80%_at_50%_0%,#1f5b57_0%,#0e2a33_62%)] px-6 pt-10 pb-8"
    >
      <div className="text-center">
        <p className="text-foam/70 font-semibold">{stage === 'ringing' ? 'Incoming call' : time}</p>
        <h2 className="mt-2 text-[2rem] font-extrabold tracking-[-0.02em] leading-tight break-words">{message.sender.name}</h2>
        <p className="text-foam/75">{message.sender.handle}</p>
      </div>

      {stage === 'ringing' ? (
        <>
          <div className="flex-1 grid place-items-center">
            <span className="ring w-24 h-24 rounded-full bg-foam/10 grid place-items-center" aria-hidden="true">
              <Phone size={40} />
            </span>
          </div>
          <div className="flex justify-around">
            <RoundButton onClick={onDecline} label="Decline" tone="red">
              <PhoneOff size={28} aria-hidden="true" />
            </RoundButton>
            <RoundButton buttonRef={answerRef} onClick={onAnswer} label="Answer" tone="green">
              <Phone size={28} aria-hidden="true" />
            </RoundButton>
          </div>
        </>
      ) : (
        <>
          <div className="mt-6 flex-1 min-h-0 flex flex-col">
            <p className="text-sm font-semibold text-foam/70 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${done ? 'bg-foam/40' : 'bg-bobber-bright'}`} aria-hidden="true" />
              Live captions{source === 'elevenlabs' ? ', AI voice by ElevenLabs' : ''}
            </p>
            <p className="mt-2 flex-1 min-h-0 overflow-y-auto scroll-thin text-[1.12rem] leading-relaxed" aria-hidden="true">
              {words.slice(0, shown).join('')}
            </p>
            <p className="sr-only">{message.body}</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <RoundButton onClick={onTalk} label="Talk back">
              <Mic size={26} aria-hidden="true" />
            </RoundButton>
            <RoundButton onClick={onComply} label="Do what they say">
              <Hand size={26} aria-hidden="true" />
            </RoundButton>
            <RoundButton onClick={onHangUp} label="Hang up" tone="red">
              <PhoneOff size={26} aria-hidden="true" />
            </RoundButton>
          </div>
        </>
      )}
    </div>
  );
}
