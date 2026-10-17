import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Setup from './components/Setup.jsx';
import Loading from './components/Loading.jsx';
import Play from './components/Play.jsx';
import Debrief from './components/Debrief.jsx';
import { getHealth, newSessionId, startRound } from './lib/api.js';
import { stopSpeech } from './lib/speech.js';

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [health, setHealth] = useState(null);
  const [choice, setChoice] = useState(null);
  const [round, setRound] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getHealth().then(setHealth);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  async function begin(opts) {
    setChoice(opts);
    setError('');
    setScreen('loading');
    try {
      const sessionId = newSessionId();
      const data = await startRound({ ...opts, sessionId });
      setRound({ ...data, sessionId, difficulty: opts.difficulty, language: data.scenario.language || opts.language });
      setScreen('play');
    } catch (e) {
      setError(e.message || 'Could not start the round.');
      setScreen('setup');
    }
  }

  function finish(result) {
    stopSpeech();
    setOutcome(result);
    setScreen('debrief');
  }

  function quit() {
    stopSpeech();
    setRound(null);
    setOutcome(null);
    setScreen('setup');
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-shell focus:px-4 focus:py-2">
        Skip to main content
      </a>
      <Header onHome={screen !== 'setup' ? quit : null} inRound={screen === 'play'} />
      <main id="main" className="flex-1">
        {screen === 'setup' && <Setup health={health} initial={choice} error={error} onStart={begin} />}
        {screen === 'loading' && <Loading choice={choice} />}
        {screen === 'play' && round && <Play round={round} onFinish={finish} />}
        {screen === 'debrief' && round && outcome && (
          <Debrief
            round={round}
            outcome={outcome}
            onReplay={() => begin({ ...choice, difficulty: choice.difficulty === 'easy' ? 'medium' : 'hard' })}
            onNew={quit}
          />
        )}
      </main>
    </div>
  );
}
