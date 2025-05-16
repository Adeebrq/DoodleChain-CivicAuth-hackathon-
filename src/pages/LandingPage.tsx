import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useThemeContext";
import styled, { keyframes } from "styled-components";
import { useUser } from "@civic/auth-web3/react";
import { useToaster } from "../hooks/useToaster";


const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;



const slideAnimation = keyframes`
  0% { transform: translateX(0); }
  50% { transform: translateX(-20px); }
  100% { transform: translateX(0); }
`;

const PageContainer = styled.div<{ $theme: 'light' | 'dark' }>`
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: ${props => props.$theme === 'light' ? 'var(--light-background)' : 'var(--dark-background)'};
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const HexGrid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.1;
  background: 
    linear-gradient(60deg, var(--dark-primary) 25%, transparent 25.5%, transparent 75%, var(--dark-primary) 75.5%, var(--dark-primary)) 0 0,
    linear-gradient(60deg, var(--dark-primary) 25%, transparent 25.5%, transparent 75%, var(--dark-primary) 75.5%, var(--dark-primary)) 25px 43.3px;
  background-size: 50px 86.6px;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rem;
`;

const HeroSection = styled.div`
  text-align: center;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin: 100px 0px 70px 0px;
`;

const TitleLine = styled.h1`
  font-size: 4.5rem;
  font-weight: 800;;
  margin: 0;
  background: linear-gradient(135deg, var(--light-primary), var(--dark-primary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 10px rgba(var(--light-primary), 0.2);
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const DoodleElement = styled.div<{ $theme: 'light' | 'dark' }>`
  position: absolute;
  pointer-events: none;
  opacity: 0.1;
  z-index: 1;
`;

const Brush = styled(DoodleElement)`
  top: -30px;
  right: -40px;
  width: 60px;
  height: 60px;
  border: 4px solid ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
  border-radius: 50%;
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 40px;
    background: ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
    transform: translate(-50%, 20%);
    border-radius: 4px;
  }
`;

const Pencil = styled(DoodleElement)`
  top: 20px;
  left: -50px;
  width: 8px;
  height: 80px;
  background: ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
  transform: rotate(-45deg);
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 8px 4px 0 4px;
    border-color: ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'} transparent transparent transparent;
  }
`;

const Squiggle = styled(DoodleElement)`
  bottom: -20px;
  right: -60px;
  width: 100px;
  height: 20px;
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
    clip-path: path('M0,10 Q25,20 50,10 T100,10');
  }
`;

const Circle = styled(DoodleElement)`
  bottom: 10px;
  left: -30px;
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
  border-radius: 50%;
`;

const FloatingDoodle = styled(DoodleElement)<{ $delay: number }>`
  position: absolute;
  animation: float 6s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
`;

const Star = styled(FloatingDoodle)`
  width: 20px;
  height: 20px;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  background: ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
`;

const Subtitle = styled.p<{ $theme: 'light' | 'dark' }>`
  font-size: 1.5rem;
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const CTAButton = styled.button`
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--light-primary), var(--dark-primary));
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 15px rgba(var(--dark-primary), 0.3);
  margin-top: 50px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(var(--dark-primary), 0.4);
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
`;

const FeaturesHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const FeaturesTitle = styled.h2<{ $theme: 'light' | 'dark' }>`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, var(--light-primary), var(--dark-primary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease forwards;

  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const FeaturesSubtitle = styled.p<{ $theme: 'light' | 'dark' }>`
  font-size: 1.2rem;
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  opacity: 0.8;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
`;

const FeatureCard = styled.div<{ $theme: 'light' | 'dark'; $delay: number }>`
  padding: 2rem;
  border-radius: 20px;
  background: ${props => props.$theme === 'light' ? 
    'rgba(255, 255, 255, 0.1)' : 
    'rgba(0, 0, 0, 0.2)'
  };
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--light-primary), 0.1);
  transition: transform 0.3s ease;
  animation: ${slideAnimation} 3s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  margin-bottom: 1.5rem;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--light-primary), var(--dark-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const FeatureTitle = styled.h3<{ $theme: 'light' | 'dark' }>`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
`;

const FeatureDescription = styled.p<{ $theme: 'light' | 'dark' }>`
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  opacity: 0.7;
  line-height: 1.6;
`;

const FloatingCanvas = styled.div`
  width: 100%;
  max-width: 800px;
  aspect-ratio: 16/9;
  margin: 4rem auto;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  animation: ${float} 6s ease-in-out infinite;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  background: ${props => props.theme === 'light' ? 'var(--light-background)' : 'var(--dark-background)'};
  border: 1px solid ${props => props.theme === 'light' ? 'var(--light-border)' : 'var(--dark-border)'};
`;

const CanvasPreview = styled.div<{ $theme: 'light' | 'dark' }>`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: ${props => props.$theme === 'light' ? 
    'linear-gradient(135deg, var(--light-secondary), var(--light-background))' : 
    'linear-gradient(135deg, var(--dark-secondary), var(--dark-background))'
  };

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, ${props => props.$theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} 1px, transparent 1px),
      linear-gradient(to bottom, ${props => props.$theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} 1px, transparent 1px);
    background-size: 20px 20px;
  }
`;

const DrawingElement = styled.div<{ $theme: 'light' | 'dark' }>`
  position: absolute;
  pointer-events: none;
`;

const Cursor = styled(DrawingElement)`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
  animation: none;

  &.animate {
    animation: cursorMove 8s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 40px;
    background: ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
    opacity: 0.5;
    transform-origin: top;
    transform: rotate(45deg) translateX(5px);
  }

  @keyframes cursorMove {
    0% { transform: translate(20%, 30%); }
    25% { transform: translate(80%, 60%); }
    50% { transform: translate(60%, 20%); }
    75% { transform: translate(40%, 80%); }
    100% { transform: translate(20%, 30%); }
  }
`;

const DrawingPath = styled(DrawingElement)`
  width: 100%;
  height: 100%;
  opacity: 0.6;

  path {
    stroke: ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: none;
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }

  &.animate path {
    animation: drawPath 8s linear infinite;
  }

  @keyframes drawPath {
    0% { stroke-dashoffset: 1000; }
    50% { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: 0; }
  }
`;

const CollaboratorCursor = styled(Cursor)`
  border-color: var(--dark-primary);
  transform: scale(0.8);
  animation: none;

  &.animate {
    animation: cursorMove2 10s linear infinite;
  }

  &::after {
    background: var(--dark-primary);
  }

  @keyframes cursorMove2 {
    0% { transform: translate(70%, 80%) scale(0.8); }
    25% { transform: translate(30%, 20%) scale(0.8); }
    50% { transform: translate(50%, 50%) scale(0.8); }
    75% { transform: translate(80%, 30%) scale(0.8); }
    100% { transform: translate(70%, 80%) scale(0.8); }
  }
`;

// New CivicAuth Section Components
const AuthSection = styled.div`
  width: 100%;
  padding: 4rem 0;
  text-align: center;
  position: relative;
`;

const AuthDivider = styled.div<{ $theme: 'light' | 'dark' }>`
  width: 100%;
  height: 1px;
  background: ${props => props.$theme === 'light' ? 
    'linear-gradient(90deg, transparent, var(--light-primary), transparent)' : 
    'linear-gradient(90deg, transparent, var(--dark-primary), transparent)'
  };
  margin: 2rem 0;
`;

const AuthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
`;

const AuthTitle = styled.h2<{ $theme: 'light' | 'dark' }>`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--light-primary), var(--dark-primary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const AuthDescription = styled.p<{ $theme: 'light' | 'dark' }>`
  font-size: 1.25rem;
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  opacity: 0.8;
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.6;
`;

const AuthFeaturesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  width: 100%;
`;

const AuthFeature = styled.div<{ $theme: 'light' | 'dark' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(33.333% - 2rem);
  min-width: 250px;
  padding: 1.5rem;
  border-radius: 16px;
  background: ${props => props.$theme === 'light' ? 
    'rgba(255, 255, 255, 0.8)' : 
    'rgba(0, 0, 0, 0.2)'
  };
  box-shadow: ${props => props.$theme === 'light' ? 
    '0 4px 6px rgba(0, 0, 0, 0.05)' : 
    'none'
  };
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$theme === 'light' ? 
    'rgba(var(--light-primary), 0.2)' : 
    'rgba(var(--dark-primary), 0.1)'
  };
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-3px);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AuthFeatureIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--light-primary), var(--dark-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const AuthFeatureTitle = styled.h3<{ $theme: 'light' | 'dark' }>`
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
`;

const AuthFeatureDescription = styled.p<{ $theme: 'light' | 'dark' }>`
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  opacity: 0.7;
  line-height: 1.5;
  font-size: 0.95rem;
`;

const PoweredByContainer = styled.div<{ $theme: 'light' | 'dark' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
  padding: 0.75rem 1.5rem;
  border-radius: 30px;
  background: ${props => props.$theme === 'light' ? 
    'rgba(var(--light-primary), 0.05)' : 
    'rgba(var(--dark-primary), 0.1)'
  };
  border: 1px solid ${props => props.$theme === 'light' ? 
    'rgba(var(--light-primary), 0.1)' : 
    'rgba(var(--dark-primary), 0.15)'
  };
`;

const PoweredByText = styled.span<{ $theme: 'light' | 'dark' }>`
  font-size: 0.9rem;
  opacity: 0.7;
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
`;

const CivicAuthLogo = styled.div<{ $theme: 'light' | 'dark' }>`
  font-weight: 700;
  font-size: 1rem;
  color: ${props => props.$theme === 'light' ? 'var(--light-primary)' : 'var(--dark-primary)'};
  display: flex;
  align-items: center;
  
  &:before {
    content: '🔐';
    margin-right: 0.5rem;
  }
`;

const AuthModal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div<{ $theme: 'light' | 'dark' }>`
  background: ${props => props.$theme === 'light' ? 'white' : 'var(--dark-background)'};
  padding: 2rem;
  border-radius: 20px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: modalSlideIn 0.3s ease-out;

  @keyframes modalSlideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalTitle = styled.h3<{ $theme: 'light' | 'dark' }>`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
`;

const ModalText = styled.p<{ $theme: 'light' | 'dark' }>`
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  opacity: 0.8;
  margin-bottom: 1.5rem;
`;

const ModalButton = styled.button`
  padding: 0.8rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--light-primary), var(--dark-primary));
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
`;

const CloseButton = styled.button<{ theme: 'light' | 'dark' }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  opacity: 0.6;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, signIn } = useUser();
  const { showError, showSuccess } = useToaster();
  // const [particles, setParticles] = useState<ParticleType[]>([]);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize particles for background effect
    // const particleCount = 30;
    // const newParticles = Array.from({ length: particleCount }, () => ({
    //   x: Math.random() * 100,
    //   y: Math.random() * 100,
    //   size: Math.random() * 4 + 1,
    //   speed: Math.random() * 0.3 + 0.1
    // }));
    // setParticles(newParticles);

    // Set up Intersection Observer for canvas animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsCanvasVisible(true);
            observer.disconnect(); // Stop observing once animation starts
          }
        });
      },
      {
        threshold: 0.2 // Start animation when 20% of the element is visible
      }
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
      showSuccess('Successfully signed in with CivicAuth!');
      navigate('/canvas');
    }
  }, [user, showAuthModal, navigate, showSuccess]);

  const handleGetStarted = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate('/canvas');
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      showError('Failed to authenticate. Please try again.');
      console.error('Authentication error:', error);
    }
  };

  return (
    <PageContainer $theme={theme as 'light' | 'dark'}>
      <HexGrid />
      <ContentWrapper>
        <HeroSection>
          <TitleContainer>
            <TitleLine>Draw Together.</TitleLine>
            <TitleLine>Earn Together.</TitleLine>
            <Brush $theme={theme as 'light' | 'dark'} />
            <Pencil $theme={theme as 'light' | 'dark'} />
            <Squiggle $theme={theme as 'light' | 'dark'} />
            <Circle $theme={theme as 'light' | 'dark'} />
            <Star $theme={theme as 'light' | 'dark'} $delay={0} style={{ top: '-20px', right: '20%' }} />
            <Star $theme={theme as 'light' | 'dark'} $delay={1} style={{ bottom: '10px', left: '15%' }} />
            <Star $theme={theme as 'light' | 'dark'} $delay={2} style={{ top: '30%', left: '-30px' }} />
          </TitleContainer>
          <Subtitle $theme={theme as 'light' | 'dark'}>
            Join our collaborative canvas where creativity meets community. Draw freely, tip fellow artists, 
            and be part of a growing creative ecosystem.
          </Subtitle>
          <CTAButton onClick={handleGetStarted}>
            {user ? 'Join the Canvas' : 'Get Started'}
          </CTAButton>
        </HeroSection>

        <FloatingCanvas ref={canvasRef}>
          <CanvasPreview $theme={theme as 'light' | 'dark'}>
            <DrawingPath 
              $theme={theme as 'light' | 'dark'} 
              className={isCanvasVisible ? 'animate' : ''}
            >
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M20,30 Q40,60 80,60 T60,20 T40,80 T20,30" />
              </svg>
            </DrawingPath>
            <Cursor 
              $theme={theme as 'light' | 'dark'} 
              className={isCanvasVisible ? 'animate' : ''}
            />
            <CollaboratorCursor 
              $theme={theme as 'light' | 'dark'} 
              className={isCanvasVisible ? 'animate' : ''}
            />
          </CanvasPreview>
        </FloatingCanvas>

        <FeaturesHeader>
          <FeaturesTitle $theme={theme as 'light' | 'dark'}>
            What is DoodleChain?
          </FeaturesTitle>
          <FeaturesSubtitle $theme={theme as 'light' | 'dark'}>
            DoodleChain is a solana devnet platform that combines creative expression with community engagement,
            allowing artists to collaborate, share, and earn in real-time through our solana tipping systems. without passkeys thanks to CivicAuth.
          </FeaturesSubtitle>
        </FeaturesHeader>

        <FeaturesGrid>
          <FeatureCard $theme={theme as 'light' | 'dark'} $delay={0}>
            <FeatureIcon>🎨</FeatureIcon>
            <FeatureTitle $theme={theme as 'light' | 'dark'}>Collaborative Canvas</FeatureTitle>
            <FeatureDescription $theme={theme as 'light' | 'dark'}>
              Draw in real-time with artists from around the world on our shared, infinite canvas.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard $theme={theme as 'light' | 'dark'} $delay={0.2}>
            <FeatureIcon>💰</FeatureIcon>
            <FeatureTitle $theme={theme as 'light' | 'dark'}>Earn Through Tips</FeatureTitle>
            <FeatureDescription $theme={theme as 'light' | 'dark'}>
              Receive tips from admirers of your art. Support other artists and build a creative economy.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard $theme={theme as 'light' | 'dark'} $delay={0.4}>
            <FeatureIcon>🌐</FeatureIcon>
            <FeatureTitle $theme={theme as 'light' | 'dark'}>Global Community</FeatureTitle>
            <FeatureDescription $theme={theme as 'light' | 'dark'}>
              Connect with artists worldwide, share your creativity, and inspire others in real-time.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>

        {/* New CivicAuth Section */}
        <AuthSection>
          <AuthDivider $theme={theme as 'light' | 'dark'} />
          <AuthContainer>
            <AuthTitle $theme={theme as 'light' | 'dark'}>DoodleChain is powered by CivicAuth</AuthTitle>
            <AuthDescription $theme={theme as 'light' | 'dark'}>
              Leveraging CivicAuth to provide secure, verifiable identity for all our users
              while allowing its users to get paid through the tipping system.
            </AuthDescription>
            
            <AuthFeaturesContainer>
              <AuthFeature $theme={theme as 'light' | 'dark'}>
                <AuthFeatureIcon>🔒</AuthFeatureIcon>
                <AuthFeatureTitle $theme={theme as 'light' | 'dark'}>Secure Authentication</AuthFeatureTitle>
                <AuthFeatureDescription $theme={theme as 'light' | 'dark'}>
                  Sign in securely with CivicAuth's decentralized identity solutions. No password to remember,
                  no personal data stored on servers.
                </AuthFeatureDescription>
              </AuthFeature>
              
              <AuthFeature $theme={theme as 'light' | 'dark'}>
                <AuthFeatureIcon>💳</AuthFeatureIcon>
                <AuthFeatureTitle $theme={theme as 'light' | 'dark'}>Protected Transactions</AuthFeatureTitle>
                <AuthFeatureDescription $theme={theme as 'light' | 'dark'}>
                  All tips and payments on DoodleChain are secured by CivicAuth's verification system,
                  ensuring transparent and safe economic exchange.
                </AuthFeatureDescription>
              </AuthFeature>
              
              <AuthFeature $theme={theme as 'light' | 'dark'}>
                <AuthFeatureIcon>🖼️</AuthFeatureIcon>
                <AuthFeatureTitle $theme={theme as 'light' | 'dark'}>Seamless web3 experience</AuthFeatureTitle>
                <AuthFeatureDescription $theme={theme as 'light' | 'dark'}>
                  CivicAuth helps you to automatically create and link your web3 solana wallet without the need for memorizing some boring passkeys.
                </AuthFeatureDescription>
              </AuthFeature>
            </AuthFeaturesContainer>
            
            <PoweredByContainer $theme={theme as 'light' | 'dark'}>
              <CivicAuthLogo $theme={theme as 'light' | 'dark'}>CivicAuth</CivicAuthLogo>
              <PoweredByText $theme={theme as 'light' | 'dark'}>Your email, your crypto</PoweredByText>
            </PoweredByContainer>
          </AuthContainer>
        </AuthSection>
      </ContentWrapper>

      <AuthModal $isOpen={showAuthModal}>
        <ModalContent $theme={theme as 'light' | 'dark'}>
          <CloseButton 
            onClick={() => setShowAuthModal(false)}
            theme={theme as 'light' | 'dark'}
          >
            ×
          </CloseButton>
          <ModalTitle $theme={theme as 'light' | 'dark'}>
            Authentication Required
          </ModalTitle>
          <ModalText $theme={theme as 'light' | 'dark'}>
            Please log in with any of your socials to access the collaborative canvas and start creating!
          </ModalText>
          <ModalButton onClick={handleSignIn}>
            Log in with CivicAuth
          </ModalButton>
        </ModalContent>
      </AuthModal>
    </PageContainer>
  );
};

export default LandingPage;