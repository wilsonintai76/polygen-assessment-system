import React, { useState } from 'react';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';
import { User } from '../../types';

interface PublicLandingProps {
  onLogin: (user: User, token: string) => void;
  showToast?: (message: string, section: string) => void;
  initialMode?: 'login' | 'register' | 'forgot_password' | 'update_password';
  onCancelRecovery?: () => void;
}

const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1";

export const PublicLanding: React.FC<PublicLandingProps> = ({ onLogin, showToast, initialMode = 'login', onCancelRecovery }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password' | 'update_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await api.auth.signInWithGoogle();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Google authentication failed.");
      }
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'register') {
        if (!fullName || !email || !password) throw new Error("Please fill all fields.");
        if (!email.endsWith('@poliku.edu.my')) throw new Error("Registration is only allowed for @poliku.edu.my email addresses.");
        if (password.length < 12) throw new Error("Password must be at least 12 characters.");
        
        const response = await api.auth.register({ 
          email, 
          full_name: fullName.toUpperCase(), 
          password
        });
        
        // If Supabase requires email confirmation, the session might be null
        if (response.token) {
          onLogin(response.user, response.token);
        } else {
          const msg = "Registration successful! Please check your email to verify your account.";
          setSuccessMsg(msg);
          if (showToast) showToast(msg, "Authentication");
          setMode('login');
        }
      } else if (mode === 'login') {
        const response = await api.auth.login(email, password);
        onLogin(response.user, response.token);
      } else if (mode === 'forgot_password') {
        if (!email) throw new Error("Please enter your email address.");
        await api.auth.resetPassword(email);
        const msg = "Password reset email sent! Please check your inbox.";
        setSuccessMsg(msg);
        if (showToast) showToast(msg, "Authentication");
        setMode('login');
      } else if (mode === 'update_password') {
        if (!password) throw new Error("Please enter a new password.");
        if (password.length < 12) throw new Error("Password must be at least 12 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        
        await api.auth.updatePassword(password);
        const msg = "Password updated successfully! You can now access your dashboard.";
        setSuccessMsg(msg);
        if (showToast) showToast(msg, "Authentication");
        
        // After updating password, we should be logged in. 
        // We can fetch the session to get the user data.
        const session = await api.auth.getSession();
        if (session) {
          // Fetch profile
          const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
          if (profile) {
            onLogin({
              ...profile,
              deptId: profile.department_id,
              programmeId: profile.programme_id,
            } as User, session.access_token);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-cyan-500 font-bold text-slate-700 transition placeholder:text-slate-300 text-sm";

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-cyan-500/30">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="https://odzvkxzgoibxxybcocbr.supabase.co/storage/v1/object/public/branding/horizontal%20logo.png" alt="Landing Logo" className="h-10 object-contain" referrerPolicy="no-referrer" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#compliance" className="hover:text-white transition-colors">Compliance</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-24 pb-16 lg:pt-0 lg:h-[calc(100vh-80px)] flex items-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
           <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            
            {/* Hero Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                System Operational
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-white mb-6 leading-[0.9]">
                Academic <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Excellence</span> <br/>
                Secured.
              </h1>
              <p className="text-base md:text-lg text-slate-400 mb-8 md:mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed">
                The centralized command hub for polytechnic assessment generation, 
                CIST mapping, and institutional quality assurance.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                   <span className="text-xl">🛡️</span>
                   <div className="text-left">
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Security Level</div>
                      <div className="text-xs font-bold text-white">Enterprise Grade</div>
                   </div>
                </div>
                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                   <span className="text-xl">⚡</span>
                   <div className="text-left">
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Performance</div>
                      <div className="text-xs font-bold text-white">Real-time Sync</div>
                   </div>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md shrink-0">
              <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-cyan-900/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    {mode === 'register' ? 'Staff Registration' : mode === 'forgot_password' ? 'Reset Password' : mode === 'update_password' ? 'Set New Password' : 'Workspace Access'}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    {mode === 'register' ? 'Create your secure academic profile.' : mode === 'forgot_password' ? 'Enter your email to receive a reset link.' : mode === 'update_password' ? 'Enter your new secure password below.' : 'Authenticate to access your dashboard.'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {mode === 'register' && (
                    <div className="space-y-1.5">
                       <label className={labelClass}>Full Name</label>
                       <input 
                          type="text" 
                          required
                          className={inputClass}
                          placeholder="e.g. AHMAD FAIZAL"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                       />
                    </div>
                  )}

                  {(mode !== 'update_password') && (
                    <div className="space-y-1.5">
                       <label className={labelClass}>Email Address</label>
                       <input 
                          type="email" 
                          required
                          className={inputClass}
                          placeholder="staff@poliku.edu.my"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                       />
                    </div>
                  )}
                  
                  {mode !== 'forgot_password' && (
                    <>
                      <div className="space-y-1.5">
                         <div className="flex justify-between items-center">
                            <label className={labelClass}>{mode === 'update_password' ? 'New Password' : 'Password'}</label>
                            {mode === 'login' && (
                              <button 
                                type="button"
                                onClick={() => { setMode('forgot_password'); setError(''); setSuccessMsg(''); }}
                                className="text-[10px] font-black text-cyan-600 uppercase tracking-widest hover:text-cyan-700 transition"
                              >
                                Forgot?
                              </button>
                            )}
                         </div>
                         <input 
                            type="password" 
                            required
                            minLength={12}
                            className={inputClass}
                            placeholder={mode === 'update_password' ? "Minimum 12 characters" : "Enter your password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                         />
                      </div>
                      {mode === 'update_password' && (
                        <div className="space-y-1.5">
                           <label className={labelClass}>Confirm New Password</label>
                           <input 
                              type="password" 
                              required
                              minLength={12}
                              className={inputClass}
                              placeholder="Repeat new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                           />
                        </div>
                      )}
                    </>
                  )}

                  {error && (
                      <div className="bg-rose-50 text-rose-500 text-xs font-bold p-3 rounded-xl border border-rose-100 flex items-center gap-2 animate-in shake duration-300">
                          <span>⚠️</span> {error}
                      </div>
                  )}

                  {successMsg && (
                      <div className="bg-emerald-50 text-emerald-600 text-xs font-bold p-3 rounded-xl border border-emerald-100 flex items-center gap-2 animate-in fade-in duration-300">
                          <span>✅</span> {successMsg}
                      </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (mode === 'register' ? 'Complete Registration' : mode === 'forgot_password' ? 'Send Reset Link' : mode === 'update_password' ? 'Update Password' : 'Authenticate Session')}
                  </button>

                  {(mode === 'login' || mode === 'register') && (
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                        <span className="bg-white px-4 text-slate-400">Or continue with</span>
                      </div>
                    </div>
                  )}

                  {(mode === 'login' || mode === 'register') && (
                    <button 
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className="w-full bg-white text-slate-700 font-bold py-3.5 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {googleLoading ? (
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                            <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.043.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                          </svg>
                          Institutional Google ID
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex flex-col gap-2 text-center pt-2">
                    {(mode === 'login' || mode === 'register') && (
                      <button 
                        type="button"
                        onClick={() => { 
                          setMode(mode === 'register' ? 'login' : 'register'); 
                          setError(''); 
                          setSuccessMsg(''); 
                        }}
                        className="text-[10px] font-black text-cyan-600 uppercase tracking-widest hover:underline"
                      >
                        {mode === 'register' ? 'Return to Login' : "New Staff Registration"}
                      </button>
                    )}
                    
                    {(mode === 'forgot_password' || mode === 'update_password') && (
                      <button 
                        type="button"
                        onClick={() => { 
                          if (mode === 'update_password' && onCancelRecovery) {
                            onCancelRecovery();
                          } else {
                            setMode('login'); 
                          }
                          setError(''); 
                          setSuccessMsg(''); 
                        }}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition"
                      >
                        Back to Login
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="py-24 bg-slate-900 border-t border-white/5 relative">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">System Capabilities</h2>
               <p className="text-slate-400 max-w-2xl mx-auto">Designed for the specific needs of Malaysian Polytechnic institutions, ensuring compliance with MQF and Dublin Accord standards.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { icon: '🧬', title: 'Smart CIST Mapping', desc: 'Automated constructive alignment between CLOs, PLOs, and assessment items.' },
                 { icon: '🗄️', title: 'Centralized Bank', desc: 'Secure repository for vetted questions with taxonomy level tracking.' },
                 { icon: '📝', title: 'Auto-Formatting', desc: 'One-click generation of perfectly formatted exam papers and answer schemes.' }
               ].map((feature, i) => (
                 <div key={i} className="bg-slate-800/50 border border-white/5 p-8 rounded-3xl hover:bg-slate-800 transition duration-300">
                    <div className="w-12 h-12 bg-slate-700/50 rounded-2xl flex items-center justify-center text-2xl mb-6">{feature.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center flex flex-col items-center gap-4">
         <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            © 2025 PolyGen Enterprise System • Ministry of Higher Education
         </p>
         <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
           <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
           <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
         </div>
      </footer>
    </div>
  );
};
