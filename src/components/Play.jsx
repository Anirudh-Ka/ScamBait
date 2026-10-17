import { useEffect, useMemo, useRef, useState } from 'react';
import Phone from './phone/Phone.jsx';
import Inbox from './phone/Inbox.jsx';
import MessageView from './phone/MessageView.jsx';
import ChatThread from './phone/ChatThread.jsx';
import IncomingCall from './phone/IncomingCall.jsx';
import { TacticPicker, PaySheet, Sting } from './phone/Sheets.jsx';
import WalletPanel, { MobileBar } from './WalletPanel.jsx';
import FieldNotes from './FieldNotes.jsx';
import { sendMoney } from '../lib/api.js';
import { stopSpeech } from '../lib/speech.js';
import { scoreReport, scoreTrust, scorePaid } from '../lib/game.js';

export default function Play({ round, onFinish }) {
  const { persona, scenario, sessionId, language, integrations } = round;
  const all = scenario.messages;
  const byId = useMemo(() => Object.fromEntries(all.map((m) => [m.id, m])), [all]);
  const callMsg = useMemo(() => all.find((m) => m.channel === 'call'), [all]);

  const [account, setAccount] = useState(round.account);
  const [results, setResults] = useState({});
  const [view, setView] = useState({ type: 'inbox' });
  const [overlay, setOverlay] = useState(null); // { type: 'report' | 'pay', id }
  const [sting, setSting] = useState(null);
  const [callStage, setCallStage] = useState(callMsg ? 'waiting' : 'none'); // waiting ringing active talking ending declined done
  const [chats, setChats] = useState({});
  const [focusId, setFocusId] = useState(null);
  const [activeFlag, setActiveFlag] = useState(null);
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const notesRef = useRef(null);

  const announce = (text) => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(text), 50);
  };

  const callInInbox = callMsg && (['declined', 'done'].includes(callStage) || results[callMsg.id]);
  const inbox = all.filter((m) => m.channel !== 'call' || callInInbox);
  const done = Object.keys(results).length;
  const allDone = all.every((m) => results[m.id]);
  const points = Object.values(results).reduce((s, r) => s + (r.points || 0), 0);

  // The phone rings once the player has handled their first message.
  useEffect(() => {
    if (callStage !== 'waiting' || !callMsg) return;
    const others = all.filter((m) => m.channel !== 'call');
    const handled = others.filter((m) => results[m.id]).length;
    const ready = (handled >= 1 && view.type === 'inbox' && !overlay && !sting) || handled === others.length;
    if (!ready) return;
    const t = setTimeout(() => {
      setCallStage('ringing');
      announce(`Incoming call from ${callMsg.sender.name}.`);
    }, 1400);
    return () => clearTimeout(t);
  }, [results, view, overlay, sting, callStage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (allDone) announce('Every message is checked. Open your results when you are ready.');
  }, [allDone]);

  function resolve(m, r) {
    setResults((prev) => ({ ...prev, [m.id]: r }));
    setFocusId(m.id);
    setActiveFlag(null);
    if (m.channel === 'call') setCallStage('done');
  }

  function openMessage(id) {
    stopSpeech();
    setActiveFlag(null);
    setView({ type: 'message', id });
    if (results[id]) setFocusId(id);
  }

  function backToInbox() {
    stopSpeech();
    setView({ type: 'inbox' });
  }

  function submitReport(picked) {
    const m = byId[overlay.id];
    const r = scoreReport(m, picked);
    resolve(m, r);
    setOverlay(null);
    setView({ type: 'message', id: m.id });
    announce(m.isScam ? `Correct, that was a scam. Plus ${r.points} points.` : `That one was actually real. Plus ${r.points} points for being careful.`);
  }

  function cancelReport() {
    const m = byId[overlay.id];
    setOverlay(null);
    // Backing out of reporting a live call leaves it as a voicemail.
    if (m.channel === 'call' && !results[m.id] && ['ending', 'talking'].includes(callStage)) {
      setCallStage('declined');
      setView({ type: 'inbox' });
    }
  }

  async function takeMoney(m, kind) {
    if (busy) return;
    setBusy(true);
    const amount = Math.min(account.balance, m.askAmount);
    const recipient = m.ask?.recipient || m.sender.name;
    const method = m.ask?.method || 'transfer';
    let via = 'mock';
    if (amount > 0) {
      try {
        const acct = await sendMoney({ sessionId, amount, recipient, method, messageId: m.id });
        setAccount(acct);
        via = acct.sent?.[acct.sent.length - 1]?.via || 'mock';
      } catch {
        setAccount((a) => ({ ...a, balance: Math.max(0, a.balance - amount), sent: [...(a.sent || []), { id: `tx-${Date.now()}`, amount, recipient, method, via: 'mock' }] }));
      }
    }
    const r = kind === 'paid' ? scorePaid(m, account.balance) : scoreTrust(m, account.balance);
    resolve(m, { ...r, lost: amount });
    setOverlay(null);
    setView({ type: 'message', id: m.id });
    if (amount > 0) setSting({ id: m.id, amount, recipient, method, via });
    announce(amount > 0 ? `That was a scam. ${recipient} took $${amount}.` : 'That was a scam, but there was nothing left to take.');
    setBusy(false);
  }

  function trust(m) {
    if (!m.isScam) {
      resolve(m, scoreTrust(m, account.balance));
      announce('Correct, that one was real. Plus 100 points.');
    } else {
      takeMoney(m, 'fooled');
    }
  }

  function finish() {
    const list = all.map((m) => ({
      id: m.id,
      isScam: m.isScam,
      scamType: m.scamType,
      tactics: m.tactics,
      channel: m.channel,
      sender: m.sender.name,
      outcome: results[m.id]?.outcome,
      points: results[m.id]?.points || 0,
      lost: results[m.id]?.lost || 0,
    }));
    onFinish({ results: list, account, points });
  }

  const showWhy = () => notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const current = view.id ? byId[view.id] : null;
  const focusMsg = focusId ? byId[focusId] : null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-5 lg:py-8">
      <p className="sr-only" aria-live="assertive">
        {announcement}
      </p>
      {scenario.note && (
        <p className="mb-4 text-sm text-abyss-soft text-center lg:text-left">{scenario.note}</p>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:gap-6 lg:grid-cols-[270px_400px_minmax(0,1fr)] xl:grid-cols-[290px_400px_minmax(0,1fr)] lg:items-start">
        <div className="lg:hidden">
          <MobileBar account={account} points={points} done={done} total={all.length} />
          {allDone && (
            <button onClick={finish} className="mt-3 w-full h-12 rounded-full bg-abyss text-foam font-bold">
              See how you did
            </button>
          )}
        </div>

        <WalletPanel
          className="hidden lg:block lg:sticky lg:top-24"
          persona={persona}
          account={account}
          points={points}
          done={done}
          total={all.length}
          allDone={allDone}
          onFinish={finish}
          scenario={scenario}
          integrations={integrations}
        />

        <Phone label={`${persona.name.split(' ')[0]}'s phone`}>
          {view.type === 'inbox' && <Inbox persona={persona} messages={inbox} results={results} onOpen={openMessage} remaining={inbox.filter((m) => !results[m.id]).length} />}

          {view.type === 'message' && current && (
            <MessageView
              key={current.id}
              message={current}
              result={results[current.id]}
              language={language}
              activeFlag={focusId === current.id ? activeFlag : null}
              onActivateFlag={(i) => {
                setFocusId(current.id);
                setActiveFlag(i);
              }}
              onBack={backToInbox}
              onReport={() => setOverlay({ type: 'report', id: current.id })}
              onTrust={() => trust(current)}
              onReply={() => setView({ type: 'chat', id: current.id, mode: current.channel === 'call' ? 'call' : 'text' })}
              onWhy={showWhy}
            />
          )}

          {view.type === 'chat' && current && (
            <ChatThread
              key={current.id + view.mode}
              message={current}
              mode={view.mode}
              persona={persona}
              language={language}
              history={chats[current.id] || []}
              setHistory={(h) => setChats((c) => ({ ...c, [current.id]: h }))}
              onBack={() => {
                stopSpeech();
                if (view.mode === 'call' && callStage === 'talking') setCallStage('declined');
                setView(results[current.id] || view.mode === 'call' ? { type: 'inbox' } : { type: 'message', id: current.id });
              }}
              onPay={() => setOverlay({ type: 'pay', id: current.id })}
              onReport={() => {
                stopSpeech();
                setOverlay({ type: 'report', id: current.id });
              }}
            />
          )}

          {callMsg && ['ringing', 'active'].includes(callStage) && (
            <IncomingCall
              message={callMsg}
              stage={callStage}
              language={language}
              onAnswer={() => setCallStage('active')}
              onDecline={() => {
                stopSpeech();
                setCallStage('declined');
                announce('Call declined. They left a voicemail.');
              }}
              onHangUp={() => {
                stopSpeech();
                setCallStage('ending');
                setOverlay({ type: 'report', id: callMsg.id });
              }}
              onComply={() => {
                stopSpeech();
                setCallStage('ending');
                setOverlay({ type: 'pay', id: callMsg.id });
              }}
              onTalk={() => {
                stopSpeech();
                setCallStage('talking');
                setView({ type: 'chat', id: callMsg.id, mode: 'call' });
              }}
            />
          )}

          {overlay?.type === 'report' && <TacticPicker onSubmit={submitReport} onCancel={cancelReport} />}
          {overlay?.type === 'pay' && (
            <PaySheet
              message={byId[overlay.id]}
              balance={account.balance}
              onConfirm={() => takeMoney(byId[overlay.id], 'paid')}
              onCancel={() => {
                const m = byId[overlay.id];
                setOverlay(null);
                if (m.channel === 'call' && callStage === 'ending') setCallStage('active');
              }}
            />
          )}
          {sting && <Sting sting={sting} onContinue={() => setSting(null)} />}
        </Phone>

        <div className="space-y-5">
          <FieldNotes
            ref={notesRef}
            message={focusMsg}
            result={focusMsg ? results[focusMsg.id] : null}
            activeFlag={activeFlag}
            onActivateFlag={(i) => {
              setActiveFlag(i);
              if (focusMsg && (view.type !== 'message' || view.id !== focusMsg.id)) setView({ type: 'message', id: focusMsg.id });
            }}
            hasCall={Boolean(callMsg)}
          />
          <WalletPanel
            className="lg:hidden"
            persona={persona}
            account={account}
            points={points}
            done={done}
            total={all.length}
            allDone={allDone}
            onFinish={finish}
            scenario={scenario}
            integrations={integrations}
          />
        </div>
      </div>
    </div>
  );
}
