import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Settings, Tv, Youtube, Film, Music, Chrome, LayoutGrid, Trash2, ArrowLeftRight, Settings2, Play, Grid, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { VideoInfo, AppInfo } from './types';

// Icons mapping helper
const IconMap: Record<string, any> = {
  Film, Youtube, Tv, Music, Chrome, Settings, LayoutGrid
};

const ALL_APPS_DATA: AppInfo[] = [
  { id: 'netflix', name: 'Netflix', iconColor: 'bg-red-600', iconName: 'Film' },
  { id: 'youtube', name: 'YouTube', iconColor: 'bg-red-500', iconName: 'Youtube' },
  { id: 'prime', name: 'Prime Video', iconColor: 'bg-blue-500', iconName: 'Tv' },
  { id: 'music', name: 'Music', iconColor: 'bg-orange-500', iconName: 'Music' },
  { id: 'chrome', name: 'Browser', iconColor: 'bg-blue-400', iconName: 'Chrome' },
  { id: 'settings', name: 'Settings', iconColor: 'bg-gray-600', iconName: 'Settings' },
  { id: 'hulu', name: 'Hulu', iconColor: 'bg-green-500', iconName: 'Tv' },
  { id: 'disney', name: 'Disney+', iconColor: 'bg-blue-800', iconName: 'Film' },
  { id: 'hbo', name: 'Max', iconColor: 'bg-purple-600', iconName: 'Film' },
  { id: 'spotify', name: 'Spotify', iconColor: 'bg-green-600', iconName: 'Music' },
  { id: 'twitch', name: 'Twitch', iconColor: 'bg-purple-500', iconName: 'Tv' },
  { id: 'gallery', name: 'Gallery', iconColor: 'bg-yellow-500', iconName: 'LayoutGrid' },
  { id: 'games', name: 'Games', iconColor: 'bg-pink-500', iconName: 'LayoutGrid' },
  { id: 'files', name: 'Files', iconColor: 'bg-teal-500', iconName: 'LayoutGrid' }
];

export default function App() {
  const [time, setTime] = useState(new Date());
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [favorites, setFavorites] = useState<AppInfo[]>(ALL_APPS_DATA.slice(0, 5));
  const [allApps, setAllApps] = useState<AppInfo[]>(ALL_APPS_DATA);
  
  // Navigation State
  const [y, setY] = useState(1); // 0: StatusBar, 1: YouTube, 2: Dock, 3: All Apps Expanded Dock, 4+: All Apps Grid
  const [x, setX] = useState(0);
  
  // Use refs for latest state to avoid re-binding keyboard listeners
  const navState = useRef({ y: 1, x: 0 });
  useEffect(() => {
    navState.current = { y, x };
  }, [y, x]);
  
  const [blurLevel, setBlurLevel] = useState(16);
  const [dockSize, setDockSize] = useState(1);
  const [frostedIcons, setFrostedIcons] = useState(false);
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsY, setSettingsY] = useState(0); // 0: blur, 1: dock size, 2: frosted icons, 3: wallpaper, 4: close
  
  const [showAllApps, setShowAllApps] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ show: boolean; app: AppInfo | null; type: 'dock' | 'grid' }>({ show: false, app: null, type: 'dock' });
  
  // Long press handling
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch Videos
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetch('/api/youtube/trending')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setVideos(data.items);
          setNextPageToken(data.nextPageToken || null);
        } else if (Array.isArray(data)) {
          setVideos(data);
        }
      })
      .catch(console.error);
  }, []);

  const loadMoreVideos = useCallback(() => {
    if (!nextPageToken || loadingMore) return;
    setLoadingMore(true);
    fetch(`/api/youtube/trending?pageToken=${nextPageToken}`)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setVideos(prev => [...prev, ...data.items]);
          setNextPageToken(data.nextPageToken || null);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false));
  }, [nextPageToken, loadingMore]);

  // Load more when approaching end of list
  useEffect(() => {
    if (y === 1 && videos.length > 0 && x >= videos.length - 3) {
      loadMoreVideos();
    }
  }, [x, y, videos.length, loadMoreVideos]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Spatial Navigation Engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }

      if (showSettings) {
        if (e.key === 'ArrowUp') setSettingsY(y => Math.max(0, y - 1));
        else if (e.key === 'ArrowDown') setSettingsY(y => Math.min(4, y + 1));
        else if (e.key === 'ArrowLeft') {
           if (settingsY === 0) setBlurLevel(b => Math.max(0, b - 4));
           else if (settingsY === 1) setDockSize(s => Math.max(0.5, s - 0.1));
        } else if (e.key === 'ArrowRight') {
           if (settingsY === 0) setBlurLevel(b => Math.min(40, b + 4));
           else if (settingsY === 1) setDockSize(s => Math.min(1.5, s + 0.1));
        } else if (e.key === 'Enter') {
           if (settingsY === 2) {
             setFrostedIcons(prev => !prev);
           } else if (settingsY === 3) {
             document.getElementById('wallpaper-picker')?.click();
           } else if (settingsY === 4) {
             setShowSettings(false);
           }
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
           setShowSettings(false);
        }
        return;
      }

      if (contextMenu.show) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          // Context menu vertical nav
          setX((prev) => (prev === 0 ? 1 : 0)); // Hack: reuse x for context menu up/down index (0 or 1)
        } else if (e.key === 'Enter') {
           // Execute context action
           setContextMenu({ show: false, app: null, type: 'dock' });
           // reset focus
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
           setContextMenu({ show: false, app: null, type: 'dock' });
        }
        return;
      }

      let prevY = navState.current.y;
      let prevX = navState.current.x;
      let newY = prevY;
      let newX = prevX;

      if (e.key === 'ArrowUp') {
        if (prevY > 0) newY = prevY - 1;
        
        // If moving back to home from All Apps
        if (prevY === 3) {
          newY = 2; // Back to dock
          setShowAllApps(false);
        }
      } else if (e.key === 'ArrowDown') {
        if (prevY === 0) newY = 1;
        else if (prevY === 1) newY = 2;
        else if (prevY === 2) {
          newY = 3; // Move down from dock to expanded dock / all apps
          setShowAllApps(true);
        } else if (prevY >= 3) {
          const maxGridRows = Math.ceil(allApps.length / 5);
          const maxRow = 2 + maxGridRows; // 3 is expanded dock, 4+ is grid
          if (prevY < maxRow) newY = prevY + 1;
        }
      } else if (e.key === 'ArrowLeft') {
        if (prevX > 0) newX = prevX - 1;
      } else if (e.key === 'ArrowRight') {
         // Calculate max X for current row
         let maxX = 0;
         if (newY === 0) maxX = 0; // Only settings icon
         if (newY === 1) maxX = Math.max(0, videos.length - 1);
         if (newY === 2) maxX = Math.max(0, favorites.length - 1);
         if (newY === 3) maxX = Math.max(0, favorites.length); // Favorites + "All apps" button
         if (newY >= 4) {
           // Grid rows (5 columns)
           const gridIndex = (newY - 4) * 5;
           const remainingInRow = allApps.length - gridIndex;
           maxX = Math.min(4, remainingInRow - 1);
         }
         if (prevX < maxX) newX = prevX + 1;
      }

      // Boundary checks after Y change to avoid X out of bounds
      if (newY !== prevY) {
         let maxX = 0;
         if (newY === 0) maxX = 0;
         if (newY === 1) maxX = Math.max(0, videos.length - 1);
         if (newY === 2) maxX = Math.max(0, favorites.length - 1);
         if (newY === 3) maxX = Math.max(0, favorites.length);
         if (newY >= 4) {
           const gridIndex = (newY - 4) * 5;
           const remainingInRow = allApps.length - gridIndex;
           maxX = Math.min(4, Math.max(0, remainingInRow - 1));
         }
         if (newX > maxX) newX = maxX;
      }

      if (newY !== prevY) setY(newY);
      if (newX !== prevX) setX(newX);

      // Long Press Enter Logic
      if (e.key === 'Enter') {
        if (!contextMenu.show && !showSettings) {
          if (navState.current.y === 0) {
            setShowSettings(true);
            setSettingsY(0);
            return;
          }
          pressTimer.current = setTimeout(() => {
             // Handle Long Press
             let currY = navState.current.y;
             let currX = navState.current.x;
             if (currY === 2) {
               setContextMenu({ show: true, app: favorites[currX], type: 'dock' });
               setX(0); // Reset X for context menu options
             } else if (currY >= 4) {
               const idx = (currY - 4) * 5 + currX;
               setContextMenu({ show: true, app: allApps[idx], type: 'grid' });
               setX(0);
             }
          }, 600);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (pressTimer.current) {
          clearTimeout(pressTimer.current);
          pressTimer.current = null;
        }
        // Short press click action if menu not open
        if (!contextMenu.show) {
          // Normal click logic would go here
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [videos.length, favorites.length, allApps.length, contextMenu.show, showSettings, settingsY]);

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setWallpaper(url);
    }
  };

  // View components
  return (
    <div 
      className="relative w-screen h-screen text-white font-sans overflow-hidden"
      style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : 'radial-gradient(circle at 50% 50%, #0c152d 0%, #02040a 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Home Screen */}
      <motion.div 
        animate={{ y: showAllApps ? '-100vh' : 0, opacity: showAllApps ? 0 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 flex flex-col"
      >
        <StatusBar focused={y === 0} time={time} />
        
        <div className="flex-1 flex flex-col justify-center px-12 pb-20">
           <h2 className="text-xl font-medium text-white/70 mb-6 pl-2 tracking-wide">Trending on YouTube</h2>
           <YouTubeShelf videos={videos} focusedX={y === 1 ? x : -1} />
        </div>

        <Dock favorites={favorites} focusedX={y === 2 ? x : -1} showAllApps={false} blurLevel={blurLevel} dockSize={dockSize} frostedIcons={frostedIcons} />
      </motion.div>

      {/* All Apps Screen Overlay */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: showAllApps ? 0 : '100%', opacity: showAllApps ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 pt-16 flex flex-col items-center bg-black/40 backdrop-blur-2xl"
      >
        <h1 className="text-3xl font-medium mb-10 text-white/90">All Applications</h1>
        
        <Dock favorites={favorites} focusedX={y === 3 ? x : -1} showAllApps={true} blurLevel={blurLevel} dockSize={dockSize} frostedIcons={frostedIcons} />

        <div className="flex-1 w-full max-w-6xl mt-12 overflow-hidden relative">
          <div 
             className="grid grid-cols-5 gap-x-8 gap-y-14 px-12 pb-32 transition-transform duration-300"
             style={{ transform: `translateY(${y > 5 ? -(y - 5) * 140 : 0}px)` }}
          >
             {allApps.map((app, idx) => {
                const itemY = 4 + Math.floor(idx / 5);
                const itemX = idx % 5;
                const isFocused = y === itemY && x === itemX;
                
                return <AppIcon key={app.id} app={app} focused={isFocused} frosted={frostedIcons} />;
             })}
          </div>
        </div>
      </motion.div>

      {/* Context Menu Overlay */}
      <AnimatePresence>
        {contextMenu.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"
          >
             <div className="bg-white/10 border border-white/20 p-8 rounded-3xl flex flex-col items-center min-w-[320px] shadow-2xl">
               <div className="mb-6 flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-2xl ${contextMenu.app?.iconColor} flex items-center justify-center mb-4`}>
                    {contextMenu.app && IconMap[contextMenu.app.iconName] && 
                      React.createElement(IconMap[contextMenu.app.iconName], { size: 40, className: "text-white" })}
                  </div>
                  <h3 className="text-2xl font-medium">{contextMenu.app?.name}</h3>
               </div>
               
               <div className="w-full space-y-3">
                  <ContextMenuOption label={contextMenu.type === 'dock' ? 'Remove from Favorites' : 'Add to Favorites'} icon={ArrowLeftRight} focused={x === 0} />
                  <ContextMenuOption label="Uninstall Application" icon={Trash2} focused={x === 1} danger />
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center px-12"
          >
            <div className="w-full max-w-6xl flex space-x-12">
              {/* Left Preview */}
              <div className="flex-1 rounded-3xl border border-white/10 overflow-hidden relative" style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : 'none' }}>
                <div className="absolute inset-0 bg-black/20" style={{ backdropFilter: `blur(${blurLevel}px)` }}></div>
                <div className="absolute bottom-12 w-full flex justify-center scale-75 origin-bottom">
                  <div className="px-8 py-4 rounded-full bg-white/5 border border-white/10 flex items-center space-x-8 shadow-2xl" style={{ transform: `scale(${dockSize})` }}>
                     {favorites.slice(0, 3).map((app, idx) => (
                        <div key={app.id} className={`w-32 h-20 rounded-2xl ${frostedIcons ? 'bg-white/10 backdrop-blur-md' : app.iconColor} flex items-center justify-center opacity-80`}>
                          {React.createElement(IconMap[app.iconName] || LayoutGrid, { size: 32, className: frostedIcons ? app.iconColor.replace('bg-', 'text-') : "text-white" })}
                        </div>
                     ))}
                  </div>
                </div>
              </div>

              {/* Right Controls */}
              <div className="w-96 flex flex-col space-y-6">
                <h2 className="text-3xl font-medium mb-4">Settings</h2>
                
                <div className={`p-6 rounded-2xl border transition-colors ${settingsY === 0 ? 'bg-white/20 border-white' : 'bg-white/5 border-white/10'}`}>
                  <p className="text-sm text-white/70 mb-2">Blur Level ({blurLevel}px)</p>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all" style={{ width: `${(blurLevel / 40) * 100}%` }}></div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border transition-colors ${settingsY === 1 ? 'bg-white/20 border-white' : 'bg-white/5 border-white/10'}`}>
                  <p className="text-sm text-white/70 mb-2">Dock Size ({Math.round(dockSize * 100)}%)</p>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all" style={{ width: `${((dockSize - 0.5) / 1) * 100}%` }}></div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border transition-colors ${settingsY === 2 ? 'bg-white/20 border-white' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex justify-between items-center">
                    <p className="text-white font-medium">Frosted Glass Icons</p>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${frostedIcons ? 'bg-white' : 'bg-white/20'}`}>
                      <div className={`w-4 h-4 rounded-full transition-transform ${frostedIcons ? 'bg-black translate-x-6' : 'bg-white'}`} />
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border transition-colors ${settingsY === 3 ? 'bg-white/20 border-white' : 'bg-white/5 border-white/10'}`}>
                  <p className="text-white font-medium">Custom Wallpaper</p>
                  <input type="file" id="wallpaper-picker" accept="image/*" className="hidden" onChange={handleWallpaperChange} />
                </div>

                <div className={`p-4 rounded-2xl border transition-colors text-center mt-auto ${settingsY === 4 ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10'}`}>
                  <span className="font-medium">Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Components ---

function StatusBar({ focused, time }: { focused: boolean; time: Date }) {
  return (
    <div className="w-full flex justify-between items-center px-12 py-8">
       <div className="text-2xl font-medium text-white/90 drop-shadow-md tracking-wider">
         {format(time, 'h:mm a')}
       </div>
       <div className="flex items-center space-x-6 text-white/70">
         <Wifi size={24} className="text-white/80" />
         <span className="text-sm font-medium uppercase tracking-widest">{format(time, 'MMM d, yyyy')}</span>
         <div className={`p-2 rounded-full transition-all duration-300 ${focused ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-white/10 backdrop-blur-md'}`}>
           <Settings2 size={24} />
         </div>
       </div>
    </div>
  );
}

function YouTubeShelf({ videos, focusedX }: { videos: VideoInfo[], focusedX: number }) {
  if (videos.length === 0) return <div className="text-white/50 h-48 flex items-center justify-center">Loading recommendations...</div>;

  return (
    <div className="relative w-full h-56">
      <div 
        className="absolute left-0 flex space-x-6 transition-transform duration-500 ease-out px-2 py-4"
        style={{ transform: `translateX(${focusedX > 2 ? -(focusedX - 2) * 344 : 0}px)` }}
      >
         {videos.map((vid, idx) => {
            const isFocused = focusedX === idx;
            return (
              <motion.div 
                key={vid.id}
                animate={{ 
                  scale: isFocused ? 1.08 : 1,
                  y: isFocused ? -8 : 0,
                  opacity: focusedX === -1 ? 0.8 : (isFocused ? 1 : 0.6)
                }}
                className={`relative shrink-0 w-80 h-44 rounded-2xl overflow-hidden cursor-pointer
                  ${isFocused ? 'ring-4 ring-white shadow-[0_10px_40px_rgba(0,0,0,0.5)]' : 'ring-1 ring-white/10 shadow-lg'}
                `}
              >
                 <img src={vid.thumbnail} alt={vid.title} className="absolute inset-0 w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                 {isFocused && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                         <Play className="text-white fill-white" size={20} />
                      </div>
                   </div>
                 )}
                 <div className="absolute bottom-0 left-0 p-4 w-full">
                    <p className="text-sm text-white/70 mb-1 font-medium">{vid.channel}</p>
                    <h3 className="text-white font-medium text-base leading-tight line-clamp-2">{vid.title}</h3>
                 </div>
              </motion.div>
            );
         })}
      </div>
    </div>
  );
}

function Dock({ favorites, focusedX, showAllApps, blurLevel = 16, dockSize = 1, frostedIcons = false }: { favorites: AppInfo[], focusedX: number, showAllApps: boolean, blurLevel?: number, dockSize?: number, frostedIcons?: boolean }) {
  return (
    <div className="absolute bottom-12 w-full flex justify-center" style={{ transform: `scale(${dockSize})`, transformOrigin: 'bottom center' }}>
       <div className="relative px-8 py-4 rounded-full bg-white/5 border border-white/10 flex items-center space-x-8 shadow-2xl" style={{ backdropFilter: `blur(${blurLevel}px)` }}>
          {favorites.map((app, idx) => (
             <AppIcon key={app.id} app={app} focused={focusedX === idx} isDock frosted={frostedIcons} />
          ))}
          
          {showAllApps && (
            <>
              <div className="w-px h-12 bg-white/20 mx-2" />
              <div className="flex flex-col items-center">
                <motion.div 
                  animate={{ 
                    scale: focusedX === favorites.length ? 1.15 : 1,
                    y: focusedX === favorites.length ? -10 : 0
                  }}
                  className={`w-40 h-24 rounded-2xl bg-white/10 flex items-center justify-center transition-all duration-300
                    ${focusedX === favorites.length ? 'ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.3)] bg-white/30' : 'ring-1 ring-white/20'}
                  `}
                >
                   <Grid size={36} className="text-white" />
                </motion.div>
                <motion.span 
                  animate={{ opacity: focusedX === favorites.length ? 1 : 0, y: focusedX === favorites.length ? 0 : -5 }}
                  className="absolute -bottom-8 text-sm font-medium text-white/90 whitespace-nowrap drop-shadow-md"
                >
                  All Apps
                </motion.span>
              </div>
            </>
          )}
       </div>
    </div>
  );
}

interface AppIconProps {
  key?: React.Key;
  app: AppInfo;
  focused: boolean;
  isDock?: boolean;
  frosted?: boolean;
}

function AppIcon({ app, focused, isDock = false, frosted = false }: AppIconProps) {
  const IconComponent = IconMap[app.iconName] || LayoutGrid;
  
  return (
    <div className="flex flex-col items-center relative">
      <motion.div 
        animate={{ 
          scale: focused ? 1.15 : 1,
          y: focused ? -10 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`w-40 h-24 rounded-2xl flex items-center justify-center
          ${frosted ? 'bg-white/10 backdrop-blur-md' : app.iconColor}
          ${focused ? 'ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.4)] z-10' : 'ring-1 ring-white/10 opacity-80'}
        `}
      >
         <IconComponent size={36} className={`drop-shadow-sm ${frosted ? app.iconColor.replace('bg-', 'text-') : 'text-white'}`} />
      </motion.div>
      
      <motion.span 
        animate={{ 
          opacity: focused ? 1 : (isDock ? 0 : 0.7), 
          y: focused ? 0 : (isDock ? -5 : 0) 
        }}
        className={`absolute -bottom-8 text-sm font-medium text-white/90 whitespace-nowrap drop-shadow-md z-20`}
      >
        {app.name}
      </motion.span>
    </div>
  );
}

function ContextMenuOption({ label, icon: Icon, focused, danger = false }: { label: string, icon: any, focused: boolean, danger?: boolean }) {
  return (
    <div className={`w-full flex items-center space-x-4 px-6 py-4 rounded-xl transition-colors duration-200
      ${focused ? (danger ? 'bg-red-500/20 ring-2 ring-red-400' : 'bg-white/20 ring-2 ring-white') : 'bg-transparent'}
    `}>
       <Icon size={20} className={danger ? 'text-red-400' : 'text-white'} />
       <span className={`font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</span>
    </div>
  );
}
