import { UserButton, useUser } from "@civic/auth-web3/react";
import { useTheme } from "../hooks/useThemeContext";
import styled from "styled-components";
import "../styles/theme.css";
import { useWalletContext } from "../hooks/useWalletContext";
import { useToaster } from "../hooks/useToaster";
import solIcon from "../assets/solicon.svg"
import { useNavigate } from "react-router-dom";
import { MoonLoader } from "react-spinners";
import { useState, useEffect } from "react";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const { publicKey, balance, connection, exportBalance } = useWalletContext();
  const { showSuccess, showError } = useToaster();
  const navigate = useNavigate();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const Copytext = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if(publicKey) {
      showSuccess("Public key copied!")
    }else{
      showError("Login to copy your public key")
    }
  };

  // Get connection name from the endpoint URL
  const getConnectionName = () => {
    if (!connection) return '';
    const endpoint = connection.rpcEndpoint;
    if (endpoint.includes('devnet')) return 'Devnet';
    if (endpoint.includes('testnet')) return 'Testnet';
    if (endpoint.includes('mainnet')) return 'Mainnet';
    return 'Unknown';
  };

  const refresh = () => {
    exportBalance();
  }

  return (
    <HeaderContainer className={`${theme}-mode ${className}`} theme={theme}>
      <Logo onClick={() => navigate('/')}>
        <h1>DoodleChain</h1>
        <Punchline theme={theme}>A web3 Art Playground</Punchline>
      </Logo>
      
      <RightSection>
        {isLoading ? (
          <LoaderContainer>
            <MoonLoader
              size={30}
              color={theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'}
            />
          </LoaderContainer>
        ) : user ? (
          <>
            <ButtonContainer theme={theme}>
              <UserButton 
                className="login-button" 
                dropdownButtonClassName="internal-button" 
              />
            </ButtonContainer>
            <WalletStatus theme={theme}>
              <WalletItem onClick={() => Copytext(publicKey as string)}>
                {publicKey?.slice(0,5)}...
              </WalletItem>
              <WalletItem>
                <SolanaIcon src={solIcon} alt="SOL" />
                {balance?.toFixed(2) ?? '0.00'}
              </WalletItem>
              <NetworkBadge theme={theme}>
                {getConnectionName()}
              </NetworkBadge>
              <RefreshButton onClick={refresh} theme={theme}>
                🔁
              </RefreshButton>
            </WalletStatus>
          </>
        ) : (
          <ButtonContainer theme={theme}>
            <UserButton 
              className="login-button" 
              dropdownButtonClassName="internal-button" 
            />
          </ButtonContainer>
        )}
        <ThemeToggle 
          onClick={toggleTheme}
          role="button"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          tabIndex={0}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              toggleTheme();
            }
          }}
          theme={theme}
        >
          <ToggleSwitch theme={theme}>
            {theme === 'light' ? '☀️' : '🌙'}
          </ToggleSwitch>
        </ThemeToggle>
      </RightSection>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header<{ theme: 'light' | 'dark' }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--${props => props.theme}-border);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: ${props => 
    props.theme === 'light' ? 'var(--light-background)' : 'var(--dark-background)'};
  transition: background-color 0.3s ease, border-color 0.3s ease;
  height: 5%;

  h1{
    font-family: "CustomFont";
  }
`;

const ButtonContainer = styled.div<{ theme: 'light' | 'dark' }>`
  .login-button {
    color: ${props => props.theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
    background-color: ${props => props.theme === 'light' ? 'var(--light-secondary)' : 'var(--dark-secondary)'};
    border: 2px solid ${props => props.theme === 'light' ? 'var(--light-border)' : 'var(--dark-border)'};
    border-radius: 8px;
    padding: 8px 16px;
    transition: all 0.3s ease;

    &:hover {
      background-color: ${props => props.theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
      color: white;
    }
  }

  .internal-button {
    background-color: ${props => props.theme === 'light' ? 'var(--light-secondary)' : 'var(--dark-secondary)'};
    color: ${props => props.theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
    border: 2px solid ${props => props.theme === 'light' ? 'var(--light-border)' : 'var(--dark-border)'};
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background-color: ${props => props.theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
      color: white;
    }
  }
`;

const RefreshButton = styled.div<{ theme: 'light' | 'dark' }>`
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const WalletStatus = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: ${props => props.theme === 'light' ? 'var(--light-secondary)' : 'var(--dark-secondary)'};
  border-radius: 8px;
  border: 2px solid ${props => props.theme === 'light' ? 'var(--light-border)' : 'var(--dark-border)'};
`;

const WalletItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const SolanaIcon = styled.img`
  width: 12px;
  height: 12px;
  margin-right: 4px;
`;

const NetworkBadge = styled.div<{ theme: 'light' | 'dark' }>`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  background-color: ${props => props.theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
  color: white;
`;

const Punchline = styled.div<{theme: 'light' | 'dark'}>`
  font-size: 12px;
  font-family: 'Gill Sans', 'Gill Sans MT';
  color: ${props => props.theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  opacity: 0.8;
`;

const Logo = styled.div`
  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  cursor: pointer;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ThemeToggle = styled.div<{ theme: 'light' | 'dark' }>`
  position: relative;
  width: 60px;
  height: 30px;
  background-color: ${props => props.theme === 'light' ? '#e2e8f0' : '#2d3748'};
  border-radius: 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
`;

const ToggleSwitch = styled.div<{ theme: 'light' | 'dark' }>`
  position: absolute;
  top: 2px;
  left: ${props => props.theme === 'light' ? '2px' : '32px'};
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: ${props => props.theme === 'light' ? '#fbbf24' : '#f1f5f9'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.3s ease, background-color 0.3s ease;
  font-size: 14px;
`;

const LoaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
`;

export default Header;