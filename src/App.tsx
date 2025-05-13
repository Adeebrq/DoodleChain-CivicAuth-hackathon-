import type {ReactNode} from 'react'
import { CivicAuthProvider } from "@civic/auth-web3/react";
import './App.css'

interface AppProps {
  children: ReactNode
}

function App({children}: AppProps) {
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
    <CivicAuthProvider 
      clientId='8c82d94c-3a91-44cf-8c84-661529040a50'
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
      displayMode="redirect"
      redirectUrl={window.location.origin}
    >
      {children}
    </CivicAuthProvider>
  )
}

export default App;