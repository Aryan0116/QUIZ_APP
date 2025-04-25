import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, X, BookOpen, PlusCircle, BarChart, LogOut, ExternalLink } from 'lucide-react';

const TeacherNavbar = () => {
  const { currentUser, logout } = useSupabaseAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/teacher', label: 'Dashboard', icon: <BookOpen className="mr-2 h-4 w-4" /> },
    { path: '/teacher/question-bank', label: 'Question Bank', icon: <BookOpen className="mr-2 h-4 w-4" /> },
    { path: '/teacher/create-quiz', label: 'Create Quiz', icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    { path: '/teacher/performance', label: 'Performance', icon: <BarChart className="mr-2 h-4 w-4" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-500 via-blue-500 to-pink-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/teacher" className="flex items-center">
                <img 
                  src="/favicon.png" 
                  alt="CoaHub Logo" 
                  className="h-8 w-8 mr-2"
                />
                <span className="text-xl font-bold">
                  <span className="text-white">DECODE CO-A </span>
                  <span className="text-yellow-300">QUIZEE</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:ml-6 md:flex md:space-x-4 lg:space-x-8">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    location.pathname === item.path
                      ? 'border-yellow-300 text-white'
                      : 'border-transparent text-gray-100 hover:border-gray-300 hover:text-white'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-150`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Advanced UI Button - Desktop */}
            <a 
              href="https://www.coahub.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden md:flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition duration-150"
            >
              DECODE CO-A
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>

            <div className="hidden md:ml-2 md:flex md:items-center">
              {currentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-yellow-500 text-black">
                          {getInitials(currentUser.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{currentUser.name}</p>
                        <p className="w-full truncate text-sm text-gray-500">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              {/* Advanced UI Button - Mobile (Smaller) */}
              <a 
                href="https://www.coahub.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center mr-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-medium rounded-lg transition duration-150"
              >
                DECODE
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded="false"
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900 bg-opacity-95 text-white">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`${
                  location.pathname === item.path
                    ? 'bg-purple-800 border-yellow-300 text-white'
                    : 'border-transparent text-gray-300 hover:bg-purple-700 hover:border-gray-300 hover:text-white'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center transition duration-150`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            
            {/* Advanced UI Button - Mobile Menu */}
            <a 
              href="https://www.coahub.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-yellow-400 hover:bg-purple-700 hover:text-yellow-300 transition duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <ExternalLink className="mr-2 h-4 w-4" />
                DECODE CO-A QUIZEE
              </span>
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">
                Visit
              </span>
            </a>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            {currentUser && (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-yellow-500 text-black">
                        {getInitials(currentUser.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{currentUser.name}</div>
                    <div className="text-sm font-medium text-gray-300">{currentUser.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:bg-purple-700 hover:text-red-300"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default TeacherNavbar;