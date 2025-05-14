import { CivicAuthProvider } from "@civic/auth-web3/react";
import { ThemeProvider } from './hooks/useThemeContext';
import Layout from './layout/Layout';
import LandingPage from './pages/LandingPage';
import Canvas from "./pages/Canvas";
import './App.css';
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";

function App() {
  const handleSignIn = async (error?: Error) => {
    if (error) {
      console.error('Sign in error:', error);
    } else {
      console.log('Successfully signed in');
    }
  };

  const handleSignOut = async () => {
    console.log('Successfully signed out');
  };

  return (
    <Router>
      <ThemeProvider>
        <CivicAuthProvider 
          clientId='8c82d94c-3a91-44cf-8c84-661529040a50'
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          displayMode="redirect"
          redirectUrl={window.location.origin}
        >
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage/>}/>
              <Route path="/canvas" element={<Canvas/>}/>
            </Routes>
          </Layout>
        </CivicAuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;