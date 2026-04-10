import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  MessageSquare, 
  BookOpen, 
  Info, 
  Send, 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Calendar,
  Award,
  Search,
  Bot,
  User,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { HANDBOOK_TEXT } from './handbook.ts';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'key-points'>('chat');
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Generate initial summary and key points
    generateInitialContent();
  }, []);

  const generateInitialContent = async () => {
    try {
      const summaryResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on the following HKBK Employee Handbook, provide a concise 2-paragraph summary for a new faculty member:\n\n${HANDBOOK_TEXT}`,
      });
      setSummary(summaryResponse.text || 'Summary could not be generated.');

      const pointsResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on the following HKBK Employee Handbook, list 8 most critical points a new faculty member must know immediately. Return as a simple list:\n\n${HANDBOOK_TEXT}`,
      });
      const points = pointsResponse.text?.split('\n').filter(p => p.trim().length > 0).map(p => p.replace(/^\d+\.\s*|-\s*/, '').trim()) || [];
      setKeyPoints(points);
    } catch (error) {
      console.error('Error generating initial content:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an HR Assistant for HKBK College of Engineering. Use the following Employee Handbook text to answer the user's question. If the answer is not in the text, say you don't know and suggest contacting the HR department.\n\nHandbook Context:\n${HANDBOOK_TEXT}\n\nUser Question: ${userMessage}`,
      });

      setMessages(prev => [...prev, { role: 'ai', content: response.text || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { role: 'ai', content: "Error: Could not reach the AI service. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900">HKBK Faculty AI</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Policy Assistant PoC</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-xs font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              System Active
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar - Navigation & Info */}
          <div className="lg:col-span-3 space-y-6">
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold">Q&A Chatbot</span>
              </button>
              <button 
                onClick={() => setActiveTab('summary')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'summary' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-semibold">Policy Summary</span>
              </button>
              <button 
                onClick={() => setActiveTab('key-points')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'key-points' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
              >
                <Award className="w-5 h-5" />
                <span className="font-semibold">Key Points</span>
              </button>
            </nav>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Info className="w-4 h-4" />
                Quick Reference
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Work Hours</p>
                    <p className="text-xs text-gray-500">8:30 AM - 4:30 PM (Teaching)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Leave Year</p>
                    <p className="text-xs text-gray-500">Jan 1st - Dec 31st</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">IT Support</p>
                    <p className="text-xs text-gray-500">itsupport@hkbk.edu.in</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' && (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 h-[calc(100vh-12rem)] flex flex-col overflow-hidden"
                >
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold">Policy Assistant</h2>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Powered by Gemini AI</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">Welcome, Faculty Member!</h3>
                          <p className="text-sm text-gray-500">
                            I'm here to help you understand the HKBK Employee Handbook. Ask me anything about leaves, attendance, or benefits.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 w-full">
                          {['What is the leave policy?', 'How many CLs can I take?', 'What are the work hours?'].map((q) => (
                            <button 
                              key={q}
                              onClick={() => setInput(q)}
                              className="text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors text-left border border-blue-100"
                            >
                              "{q}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((msg, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-200' : 'bg-blue-600'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-white" />}
                          </div>
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gray-100 text-gray-800 rounded-tr-none' : 'bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none shadow-sm'}`}>
                            <div className="prose prose-sm max-w-none prose-blue">
                              <ReactMarkdown>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[85%]">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none border border-blue-100 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            <span className="text-xs font-medium text-blue-600">Assistant is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                    <div className="relative flex items-center gap-2">
                      <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question about HKBK policies..."
                        className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                      />
                      <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-95"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'summary' && (
                <motion.div 
                  key="summary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Policy Summary</h2>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">AI-Generated Overview</p>
                    </div>
                  </div>
                  
                  <div className="prose prose-blue max-w-none">
                    {!summary ? (
                      <div className="flex items-center gap-3 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating summary...</span>
                      </div>
                    ) : (
                      <div className="text-gray-700 leading-relaxed text-lg italic border-l-4 border-blue-500 pl-6 py-2 bg-blue-50/30 rounded-r-xl">
                        {summary}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        Applicability
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        These rules apply to all HKBKGI employees unless specified otherwise. Mandatory for both teaching and non-teaching staff.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-600" />
                        Key Focus
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Focuses on attendance, leave management, performance appraisal, and professional conduct to ensure academic excellence.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'key-points' && (
                <motion.div 
                  key="key-points"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Critical Key Points</h2>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Must-Know for New Faculty</p>
                    </div>
                  </div>

                  {!keyPoints.length ? (
                    <div className="flex items-center gap-3 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Extracting key points...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {keyPoints.map((point, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-white transition-all group cursor-default"
                        >
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {i + 1}
                          </div>
                          <p className="text-sm text-gray-700 font-medium leading-relaxed">{point}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="bg-blue-600 p-6 rounded-2xl text-white flex items-center justify-between">
                    <div>
                      <h4 className="font-bold">Need more details?</h4>
                      <p className="text-xs text-blue-100">Ask the chatbot for specific policy clauses.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors"
                    >
                      Go to Chat
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
