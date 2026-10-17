import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, SendHorizontal, PhoneCall, Ban, Banknote } from 'lucide-react';
import { scammerReply } from '../../lib/api.js';
import { speak, stopSpeech } from '../../lib/speech.js';
import { voiceFor } from '../../lib/game.js';

function quickReplies(message, mode) {
  if (!message.isScam) return ['Thanks!', 'Who is this?'];
  if (message.scamType === 'voice_clone') return ["What's our family code word?", 'Let me call your parents first.', 'Okay, how do I pay?'];
  if (mode === 'call') return ['Who am I speaking with?', "I'll hang up and call the number on my card.", 'Okay, tell me what to do.'];
  return ['Who is this?', 'How do I know this is real?', "I'll check with my bank first.", 'Okay, what do I need to do?'];
}

function Pressure({ level }) {
  const words = ['', 'low', 'rising', 'high', 'very high', 'extreme'];
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Pressure ${level} of 5, ${words[level]}`}>
      <span className="hidden min-[370px]:inline text-[0.72rem] font-semibold text-abyss-soft">Pressure</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`w-2 h-4 rounded-sm transition-colors ${i <= level ? (level >= 4 ? 'bg-bobber' : 'bg-bobber-bright') : 'bg-line'}`} />
        ))}
      </span>
    </div>
  );
}

export default function ChatThread({ message, mode, persona, language, history, setHistory, onBack, onPay, onReport }) {
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [pressure, setPressure] = useState(history.length ? 3 : 1);
  const isCall = mode === 'call';
  // On a call they have already asked for money, so paying is possible right away.
  const [canPay, setCanPay] = useState(isCall || history.filter((h) => h.from === 'them').length >= 2);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, waiting]);

  useEffect(() => () => stopSpeech(), []);

  async function send(text) {
    const t = text.trim();
    if (!t || waiting || ended) return;
    setInput('');
    setError('');
    const next = [...history, { from: 'you', text: t }];
    setHistory(next);
    setWaiting(true);
    try {
      const r = await scammerReply({ message, history: next, persona, language });
      const withReply = [...next, { from: 'them', text: r.reply }];
      setHistory(withReply);
      setPressure(r.pressure || 3);
      if (message.isScam && (r.asksForMoney || withReply.filter((h) => h.from === 'them').length >= 2)) setCanPay(true);
      if (r.ended) setEnded(true);
      if (isCall) speak(r.reply, { voice: voiceFor(message), language });
    } catch (e) {
      setError(e.message || 'They did not answer. Try again.');
    } finally {
      setWaiting(false);
      inputRef.current?.focus();
    }
  }

  const original = `${message.subject ? message.subject + '\n\n' : ''}${message.body}`;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 pl-2 pr-4 py-1.5 flex items-center gap-1 border-b border-line">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full text-kelp hover:bg-foam" aria-label={isCall ? 'Leave the call' : 'Back to message'}>
          <ChevronLeft size={24} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight truncate flex items-center gap-1.5">
            {isCall && <PhoneCall size={15} className="text-kelp shrink-0" aria-hidden="true" />}
            {message.sender.name}
          </p>
          <p className="text-[0.75rem] text-abyss-soft truncate">{isCall ? 'On a call. Their replies are spoken aloud.' : message.sender.handle}</p>
        </div>
        {message.isScam && <Pressure level={pressure} />}
      </div>

      <ol ref={listRef} className="flex-1 min-h-0 overflow-y-auto scroll-thin px-3 py-4 space-y-2.5" aria-live="polite" aria-relevant="additions">
        <li className="max-w-[85%] rounded-[20px] rounded-bl-md bg-foam-deep px-3.5 py-2.5 text-[0.95rem] leading-snug whitespace-pre-wrap">
          <span className="sr-only">{message.sender.name}: </span>
          {original}
        </li>
        {history.map((h, i) => (
          <li
            key={i}
            className={`max-w-[85%] rounded-[20px] px-3.5 py-2.5 text-[0.95rem] leading-snug whitespace-pre-wrap ${
              h.from === 'you' ? 'ml-auto rounded-br-md bg-abyss text-foam' : 'rounded-bl-md bg-foam-deep'
            }`}
          >
            <span className="sr-only">{h.from === 'you' ? 'You' : message.sender.name}: </span>
            {h.text}
          </li>
        ))}
        {waiting && (
          <li className="typing w-16 rounded-[20px] rounded-bl-md bg-foam-deep px-3.5 py-3 flex gap-1" aria-label={`${message.sender.name} is typing`}>
            <span className="w-2 h-2 rounded-full bg-abyss-soft" />
            <span className="w-2 h-2 rounded-full bg-abyss-soft" />
            <span className="w-2 h-2 rounded-full bg-abyss-soft" />
          </li>
        )}
        {ended && <li className="text-center text-sm text-abyss-soft pt-2">{message.isScam ? 'They gave up on you. Now report them.' : 'Conversation over.'}</li>}
        {error && (
          <li role="alert" className="text-center text-sm text-bobber pt-2">
            {error}
          </li>
        )}
      </ol>

      {!ended && (
        <div className="shrink-0 px-3 pb-2">
          <div className="flex gap-1.5 overflow-x-auto scroll-thin pb-2" role="group" aria-label="Suggested replies">
            {quickReplies(message, mode).map((q) => (
              <button key={q} onClick={() => send(q)} disabled={waiting} className="shrink-0 h-9 px-3 rounded-full border border-line text-sm font-semibold hover:border-abyss disabled:opacity-50">
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <label htmlFor="reply" className="sr-only">
              {isCall ? 'Say something' : 'Write a reply'}
            </label>
            <input
              ref={inputRef}
              id="reply"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isCall ? 'Say something...' : 'Write a reply...'}
              maxLength={400}
              autoComplete="off"
              className="flex-1 min-w-0 h-11 rounded-full border-2 border-line bg-shell px-4 focus:border-abyss outline-none"
            />
            <button type="submit" disabled={!input.trim() || waiting} className="w-11 h-11 rounded-full bg-abyss text-foam grid place-items-center disabled:opacity-40" aria-label="Send reply">
              <SendHorizontal size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      <div className="shrink-0 border-t border-line p-3 grid grid-cols-2 gap-2">
        {message.isScam && canPay ? (
          <button onClick={onPay} className="h-12 rounded-full border-2 border-bobber text-bobber font-bold inline-flex items-center justify-center gap-2 hover:bg-bobber-light">
            <Banknote size={18} aria-hidden="true" /> Send money
          </button>
        ) : (
          <button onClick={onBack} className="h-12 rounded-full border-2 border-line font-bold hover:border-abyss">
            {isCall ? 'Back to call' : 'Back'}
          </button>
        )}
        <button onClick={onReport} className="h-12 rounded-full bg-bobber text-shell font-bold inline-flex items-center justify-center gap-2 hover:brightness-110">
          <Ban size={18} aria-hidden="true" /> {isCall ? 'Hang up, report' : 'Block, report'}
        </button>
      </div>
    </div>
  );
}
