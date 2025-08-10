import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Admin from "./Admin";

import Game from "./Game";

import GameMode from "./GameMode";

import Onboarding from "./Onboarding";

import Games from "./Games";

import Profile from "./Profile";

import ModeratorOnboarding from "./ModeratorOnboarding";

import GameConfiguration from "./GameConfiguration";

import CreatorPanel from "./CreatorPanel";

import CreatorDashboard from "./CreatorDashboard";

import CreatorOnboarding from "./CreatorOnboarding";

import Wallet from "./Wallet";

import MyRegistrations from "./MyRegistrations";

import TournamentDetail from "./TournamentDetail";

import ModeratorDashboard from "./ModeratorDashboard";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Admin: Admin,
    
    Game: Game,
    
    GameMode: GameMode,
    
    Onboarding: Onboarding,
    
    Games: Games,
    
    Profile: Profile,
    
    ModeratorOnboarding: ModeratorOnboarding,
    
    GameConfiguration: GameConfiguration,
    
    CreatorPanel: CreatorPanel,
    
    CreatorDashboard: CreatorDashboard,
    
    CreatorOnboarding: CreatorOnboarding,
    
    Wallet: Wallet,
    
    MyRegistrations: MyRegistrations,
    
    TournamentDetail: TournamentDetail,
    
    ModeratorDashboard: ModeratorDashboard,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Game" element={<Game />} />
                
                <Route path="/GameMode" element={<GameMode />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/Games" element={<Games />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/ModeratorOnboarding" element={<ModeratorOnboarding />} />
                
                <Route path="/GameConfiguration" element={<GameConfiguration />} />
                
                <Route path="/CreatorPanel" element={<CreatorPanel />} />
                
                <Route path="/CreatorDashboard" element={<CreatorDashboard />} />
                
                <Route path="/CreatorOnboarding" element={<CreatorOnboarding />} />
                
                <Route path="/Wallet" element={<Wallet />} />
                
                <Route path="/MyRegistrations" element={<MyRegistrations />} />
                
                <Route path="/TournamentDetail" element={<TournamentDetail />} />
                
                <Route path="/ModeratorDashboard" element={<ModeratorDashboard />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}