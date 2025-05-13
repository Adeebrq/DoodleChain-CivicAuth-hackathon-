import styled from "styled-components";
import { useTheme } from "../hooks/useThemeContext";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <LayoutContainer className={`${theme}-mode`}>
      <Header />
      <MainContent>
        {children}
      </MainContent>
      <Footer />
    </LayoutContainer>
  );
};

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 2rem 2rem; /* 80px top padding to account for fixed header */
`;

export default Layout;