import { Link, useLocation } from 'react-router-dom';
import { Video, Sparkles, Clock, Grid, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useState } from 'react';

export const Header = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Grid },
    { path: '/generate', label: 'Generate', icon: Video },
    { path: '/templates', label: 'Templates', icon: Sparkles },
    { path: '/history', label: 'History', icon: Clock },
  ];

  return (
    <header className="bg-bg-secondary/80 backdrop-blur-md border-b border-bg-tertiary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-neural-cyan to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Video className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-neural-cyan bg-clip-text text-transparent">LostMind AI</span>
                  <span className="text-xs bg-neural-cyan/20 text-neural-cyan px-2 py-0.5 rounded-full">Pro</span>
                </div>
                <span className="text-xs text-gray-400 block -mt-1">Veo3 Video Generator</span>
              </div>
            </Link>

            <nav className="hidden lg:flex space-x-4 xl:space-x-6">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors min-h-[44px] ${
                    location.pathname === path
                      ? 'bg-neural-cyan/20 text-neural-cyan'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:block">{label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:block text-right">
                  <span className="text-sm text-gray-400 block truncate max-w-[150px]">
                    {user?.email}
                  </span>
                  <span className="text-xs text-neural-cyan">
                    {user?.tier === 'unlimited' ? '∞' : user?.quota_remaining} videos left
                    {user?.tier === 'premium' && ' • Premium'}
                    {user?.tier === 'free' && ' • Free'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-primary transition-colors min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-neural-cyan hover:bg-neural-dark transition-colors min-h-[44px]"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:block">Login</span>
              </Link>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 mr-1 rounded-lg bg-bg-tertiary hover:bg-bg-quaternary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-bg-tertiary bg-bg-secondary/95 backdrop-blur-md">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                    location.pathname === path
                      ? 'bg-neural-cyan/20 text-neural-cyan'
                      : 'text-gray-400 hover:text-white hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
              
              {isAuthenticated && (
                <div className="border-t border-bg-tertiary pt-4 mt-4">
                  <div className="px-4 py-2">
                    <span className="text-sm text-gray-400 block">
                      {user?.email}
                    </span>
                    <span className="text-xs text-neural-cyan">
                      {user?.tier === 'unlimited' ? '∞' : user?.quota_remaining} videos left
                      {user?.tier === 'premium' && ' • Premium'}
                      {user?.tier === 'free' && ' • Free'}
                    </span>
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};