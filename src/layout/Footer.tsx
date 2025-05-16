import styled from "styled-components";
import { useTheme } from "../hooks/useThemeContext";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer className={`${theme}-mode ${className}`} theme={theme}>
      <FooterContent>
        <FooterSection>
          <FooterTitle>DoodleChain</FooterTitle>
          <FooterText>DoodleChain is a creative playground where any can come together to draw & collaborate to visualize the creativity of their collective minds into a single canvas. one stroke at a time.</FooterText>
        </FooterSection>
      </FooterContent>

      <FooterBottom theme={theme}>
        <Copyright>© {currentYear} DoodleChain. All rights reserved.</Copyright>
        <PoweredBy>
          Powered by{' '}
          <FooterLink href="https://civic.com" target="_blank" rel="noopener noreferrer">
            Civic
          </FooterLink>
        </PoweredBy>
        <PoweredBy>
          Developed by{' '}
          <FooterLink href="https://github.com/Adeebrq" target="_blank" rel="noopener noreferrer">
            Adeeb
          </FooterLink>
        </PoweredBy>
      </FooterBottom>
    </FooterContainer>
  );
};

const FooterContainer = styled.footer<{ theme: 'light' | 'dark' }>`
  width: 100%;
  padding: 2rem 0;
  margin-top: auto;
  background-color: ${props => 
    props.theme === 'light' ? 'var(--light-secondary)' : 'var(--dark-secondary)'};
  border-top: 1px solid ${props => 
    props.theme === 'light' ? 'var(--light-border)' : 'var(--dark-border)'};
`;

const FooterContent = styled.div`
display: flex;
flex-direction: column;
padding: 0px 0px 0px 20px;

  gap: 2rem;
  width: 50%;
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FooterTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0;
  font-family: "CustomFont", sans-serif;
`;

const FooterText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
`;

// const FooterLinks = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.5rem;
// `;

const FooterLink = styled.a`
  color: inherit;
  text-decoration: none;
  font-size: 0.9rem;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
`;

const FooterBottom = styled.div<{ theme: 'light' | 'dark' }>`
  max-width: 1200px;
  margin: 2rem auto 0;
  padding: 1rem 2rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid ${props => 
    props.theme === 'light' ? 'var(--light-border)' : 'var(--dark-border)'};
  font-size: 0.9rem;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const Copyright = styled.div`
  opacity: 0.8;
`;

const PoweredBy = styled.div`
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export default Footer; 