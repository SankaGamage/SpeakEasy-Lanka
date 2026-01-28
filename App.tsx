import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppView, PracticeMode, Topic, SessionConfig } from './types';
import { Navigation } from './components/Navigation';
import { TopicCard } from './components/TopicCard';
import { Visualizer } from './components/Visualizer';
import { GeminiLiveService } from './services/geminiLiveService';
import { TOPICS } from './constants';
import { Mic, X, Award, Clock, Calendar, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Dashboard Component ---
const Dashboard: React.FC = () => {
  const data = [
    { name: 'Mon', min: 10 },
    { name: 'Tue', min: 15 },
    { name: 'Wed', min: 8 },
    { name: 'Thu', min: 20 },
    { name: 'Fri', min: 12 },
    { name: 'Sat', min: 30 },
    { name: 'Sun', min: 5 },
  ];

  return (
    <div className="p-6 pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Your Progress</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
          <div className="flex items-center space-x-2 text-teal-700 mb-2">
            <Clock size={18} />
            <span className="font-semibold text-sm">Total Time</span>
          </div>
          <p className="text-2xl font-bold text-teal-900">2.5 hrs</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
           <div className="flex items-center space-x-2 text-orange-700 mb-2">
            <Calendar size={18} />
            <span className="font-semibold text-sm">Streak</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">3 Days</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4">Weekly Activity</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#9ca3af'}} />
              <Tooltip cursor={{fill: '#f0fdfa'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="min" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start space-x-3">
        <Award className="text-blue-500 mt-1" size={24} />
        <div>
            <h3 className="font-semibold text-blue-900">Level 2: Confident Speaker</h3>
            <p className="text-sm text-blue-700 mt-1">Keep practicing to unlock Interview Master!</p>
            <div className="w-full bg-blue-200 h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-blue-500 h-full w-[60%]"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Active Session Component ---
interface SessionViewProps {
  config: SessionConfig;
  onEnd: () => void;
}

const SessionView: React.FC<SessionViewProps> = ({ config, onEnd }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const serviceRef = useRef<GeminiLiveService | null>(null);
  const timerRef = useRef<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initialized.current) return;
    initialized.current = true;

    serviceRef.current = new GeminiLiveService({
      onConnect: () => {
        setStatus('connected');
        // Start Timer
        timerRef.current = window.setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      },
      onDisconnect: () => {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      },
      onError: (err) => {
        console.error("Session Error:", err);
        setStatus('error');
        setErrorMsg(err.message || 'Connection failed');
      },
      onVolumeChange: (vol) => {
        setVolume(vol);
      }
    });

    serviceRef.current.connect(config.mode, config.topic);

    return () => {
      serviceRef.current?.disconnect();
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [config]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span className="font-medium text-gray-500 uppercase text-xs tracking-wider">
                {status === 'connecting' ? 'Connecting...' : status === 'error' ? 'Error' : 'Live Session'}
            </span>
        </div>
        <button onClick={onEnd} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
            <X size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 relative overflow-hidden">
        {/* Decorative Background Blob */}
        {status === 'connected' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-50 rounded-full blur-3xl -z-10 animate-pulse" />
        )}

        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">{config.topic?.title || 'Practice Session'}</h2>
            <p className="text-gray-500">{config.topic?.description}</p>
        </div>

        {/* Status Content */}
        {status === 'error' ? (
          <div className="flex flex-col items-center text-center max-w-xs bg-red-50 p-6 rounded-2xl border border-red-100">
            <AlertCircle className="text-red-500 mb-2" size={32} />
            <p className="text-red-800 font-medium mb-1">Oops, something went wrong.</p>
            <p className="text-red-600 text-sm">{errorMsg}</p>
            <button onClick={onEnd} className="mt-4 text-sm font-semibold text-red-600 underline">Close Session</button>
          </div>
        ) : (
          <>
            {/* Visualizer */}
            <div className="w-full max-w-xs">
                <Visualizer 
                    isActive={status === 'connected'} 
                    volume={volume} 
                    mode={volume > 0.05 ? 'listening' : 'speaking'} 
                />
            </div>

            {/* Timer */}
            <div className="text-4xl font-mono font-light text-gray-700 tracking-widest">
                {formatTime(duration)}
            </div>
          </>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-8 pb-12 flex justify-center">
        <button 
            onClick={onEnd}
            className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shadow-lg border border-red-100"
        >
            <X size={32} />
        </button>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);

  const startSession = (topic: Topic) => {
    setSessionConfig({
        mode: topic.mode,
        topic: topic
    });
  };

  const endSession = () => {
    setSessionConfig(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Active Session Overlay */}
      {sessionConfig && (
        <SessionView config={sessionConfig} onEnd={endSession} />
      )}

      {/* Main UI */}
      {!sessionConfig && (
        <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="bg-white pt-6 pb-2 px-6 sticky top-0 z-10 bg-opacity-95 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-teal-600 flex items-center gap-2">
                        <span className="bg-teal-600 text-white p-1 rounded-lg"><Mic size={16} /></span>
                        SpeakEasy Lanka
                    </h1>
                    <button className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                        <img src="https://picsum.photos/100/100" alt="Profile" className="w-full h-full object-cover" />
                    </button>
                </div>
            </div>

            {/* Views */}
            <div className="pb-20"> {/* Padding for bottom nav */}
                {currentView === AppView.HOME && (
                    <div className="px-6 space-y-6">
                        {/* Welcome Banner */}
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <h2 className="text-2xl font-bold mb-2">Ayubowan, friend! 👋</h2>
                            <p className="text-teal-100 text-sm mb-4">Ready to practice your English today? Don't worry, we'll keep it simple.</p>
                            <button 
                                onClick={() => startSession(TOPICS[1])} // Daily chat
                                className="bg-white text-teal-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-teal-50 transition-colors"
                            >
                                Start Daily Chat
                            </button>
                        </div>

                        {/* Topics Grid */}
                        <div>
                            <h3 className="font-bold text-gray-800 mb-4 text-lg">Practice Topics</h3>
                            <div className="space-y-3">
                                {TOPICS.map(topic => (
                                    <TopicCard key={topic.id} topic={topic} onClick={startSession} />
                                ))}
                            </div>
                        </div>

                        {/* Daily Tip */}
                        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex gap-3">
                            <div className="bg-yellow-100 p-2 rounded-full h-fit text-yellow-600">
                                <Award size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-800 text-sm">Tip of the Day</h4>
                                <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                                    When people say "Tell me about yourself", keep it short! Talk about your hobbies and family, not just your school marks.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {currentView === AppView.PROGRESS && <Dashboard />}
            </div>

            <Navigation 
                currentView={currentView} 
                onNavigate={setCurrentView} 
                inSession={!!sessionConfig} 
            />
        </div>
      )}
    </div>
  );
}
