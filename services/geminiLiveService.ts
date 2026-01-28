import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from './audioUtils';
import { PracticeMode, Topic } from '../types';

interface LiveServiceCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onVolumeChange: (inputVol: number, outputVol: number) => void;
  onError: (error: Error) => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<LiveSession> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private callbacks: LiveServiceCallbacks;
  private isConnected = false;
  
  constructor(callbacks: LiveServiceCallbacks) {
    this.callbacks = callbacks;
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getSystemInstruction(mode: PracticeMode, topic?: Topic): string {
    return `
You are "SpeakEasy", a warm, friendly, and supportive English tutor designed specifically for young adults (15-30) in Sri Lanka.
Your goal is to help users practice spoken English, build confidence, and improve pronunciation without fear of judgment.

Key Personality Traits:
- Friendly & Encouraging: Like a supportive older sibling or cool teacher.
- Culturally Aware: Understand Sri Lankan context (e.g., A-levels, O-levels, cricket, tuk-tuks, tea, hot weather, office life).
- Simple Language: Speak clearly, slowly, and use simple vocabulary. Avoid complex grammar jargon.
- Patient: Never interrupt aggressively. Give positive reinforcement ("That was great!", "Don't worry, take your time.").

Current Practice Mode: ${mode}
${topic ? `Current Topic: ${topic.title} (${topic.description})` : ''}

Guidelines for this mode:
${this.getModeGuidelines(mode)}

Important:
- Keep your responses concise (1-3 sentences).
- If the user makes a mistake, gently correct them.
- End your turns with an open-ended question.
    `.trim();
  }

  private getModeGuidelines(mode: PracticeMode): string {
    switch (mode) {
      case PracticeMode.PRONUNCIATION:
        return "- Focus on correcting pronunciation gently.";
      case PracticeMode.INTERVIEW:
        return "- Roleplay a professional interview.";
      case PracticeMode.GRAMMAR:
        return "- Focus on sentence structure and tenses.";
      case PracticeMode.CASUAL:
      default:
        return "- Just have a fun, relaxed chat.";
    }
  }

  async connect(mode: PracticeMode, topic?: Topic) {
    if (this.isConnected) return;
    this.isConnected = true;

    try {
      // Input Audio Context - strictly 16kHz if possible for this model
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      // Output Audio Context - 24kHz for better quality output decoding
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live API Error:', e);
            // Don't disconnect immediately on error, let the UI decide or retry, 
            // but usually a fatal error needs disconnect.
            this.callbacks.onError(new Error('Connection error'));
            this.disconnect();
          },
          onclose: (e: CloseEvent) => {
            console.log('Gemini Live API Closed:', e);
            this.disconnect();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }, 
          },
          systemInstruction: this.getSystemInstruction(mode, topic),
        },
      };

      this.sessionPromise = this.ai.live.connect(config);
      // We don't await sessionPromise here for the connection flow, 
      // but we await it to catch initial connection errors if needed.
      // However, onopen is the signal for readiness.
      
    } catch (error) {
      console.error('Failed to connect:', error);
      this.callbacks.onError(error instanceof Error ? error : new Error('Failed to connect'));
      this.disconnect();
    }
  }

  private handleOpen() {
    if (this.isConnected) {
      this.callbacks.onConnect();
      this.startAudioStreaming();
    }
  }

  private startAudioStreaming() {
    if (!this.inputAudioContext || !this.mediaStream || !this.sessionPromise) return;

    try {
      this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate Input Volume
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const vol = Math.min(1, rms * 5); 
        this.callbacks.onVolumeChange(vol, 0);

        const pcmBlob = createBlob(inputData);
        
        // Use the sessionPromise pattern to prevent race conditions
        if (this.sessionPromise) {
            this.sessionPromise.then((session) => {
                try {
                    session.sendRealtimeInput({ media: pcmBlob });
                } catch (err) {
                    console.error("Error sending audio input", err);
                }
            }).catch(err => {
                 // Session establishment failed
                 console.error("Session promise rejected", err);
            });
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.inputAudioContext.destination);
    } catch (e) {
      console.error("Error starting audio streaming", e);
      this.disconnect();
    }
  }

  private async handleMessage(message: LiveServerMessage) {
    if (!this.isConnected) return;

    try {
      const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
      
      if (base64Audio && this.outputAudioContext && this.outputNode) {
        if (this.outputAudioContext.state === 'suspended') {
            await this.outputAudioContext.resume();
        }

        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
        
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          this.outputAudioContext,
          24000,
          1
        );

        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        
        source.addEventListener('ended', () => {
          this.sources.delete(source);
        });

        source.start(this.nextStartTime);
        this.sources.add(source);
        this.nextStartTime += audioBuffer.duration;
      }

      const interrupted = message.serverContent?.interrupted;
      if (interrupted) {
        this.stopAudioPlayback();
      }
    } catch (e) {
      console.error("Error processing message", e);
    }
  }

  private stopAudioPlayback() {
    this.sources.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  async disconnect() {
    // Prevent multiple calls
    if (!this.isConnected) return;
    this.isConnected = false;

    this.stopAudioPlayback();

    // Clean up session
    if (this.sessionPromise) {
        this.sessionPromise.then(session => {
            try { session.close(); } catch(e) {}
        }).catch(() => {});
        this.sessionPromise = null;
    }

    // Audio Nodes
    if (this.source) {
        try { this.source.disconnect(); } catch (e) {}
        this.source = null;
    }
    if (this.processor) {
        try { this.processor.disconnect(); } catch (e) {}
        this.processor = null;
    }
    
    // Stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Contexts
    const closeCtx = async (ctx: AudioContext | null) => {
        if (ctx && ctx.state !== 'closed') {
            try { await ctx.close(); } catch (e) {}
        }
    };
    await closeCtx(this.inputAudioContext);
    await closeCtx(this.outputAudioContext);
    this.inputAudioContext = null;
    this.outputAudioContext = null;

    this.callbacks.onDisconnect();
  }
}
