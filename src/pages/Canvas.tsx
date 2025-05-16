import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line, Circle} from 'react-konva';
import styled from 'styled-components';
import { useTheme } from '../hooks/useThemeContext';
import Konva from 'konva';
import { db } from '../config/firebase';
import {doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import debounce from 'lodash/debounce';
import { FaPencilAlt, FaEraser } from 'react-icons/fa';
import { useWalletContext } from '../hooks/useWalletContext';
import { Modal } from '../components/Modal';
import { useToaster } from '../hooks/useToaster';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUser } from "@civic/auth-web3/react";
import { useNavigate } from 'react-router-dom';

interface LineElement {
  points: number[];
  color: string;
  tool: string;
  timestamp?: Date;
  erase?: boolean;
  owner: string;
  ownerDisplayName?: string;
  saved?: boolean;
}

// interface TileData {
//   owner: string;
//   strokes: LineElement[];
//   createdAt: Date;
//   updatedAt: Date;
// }

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  owner: string;
  ownerDisplayName?: string;
  lineId?: string;
}

const Canvas = () => {
  const { theme } = useTheme();
  const { publicKey } = useWalletContext();
  const { showError } = useToaster();
  const { user, signIn } = useUser();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lines, setLines] = useState<LineElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [eraserSize, setEraserSize] = useState(20);
  const stageRef = useRef<Konva.Stage | null>(null);
  const isLocalUpdate = useRef(false);
  // const drawingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    owner: '',
    ownerDisplayName: ''
  });
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 80
  });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [showToast, _setShowToast] = useState(false);
  const [_activeLineId, setActiveLineId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveQueue = useRef<LineElement[]>([]);
  const isProcessingSave = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOwnerAddress, setSelectedOwnerAddress] = useState<string>('');
  const lastEraserErrorTime = useRef<number>(0);

  // Current tile position and wallet info
  const tilePosition = "0_0";
  const walletPublicKey = publicKey || ""; // Use actual public key from wallet context
  const displayName = "User123"; // This could also come from user context if available

  // Add a debounced error function to prevent multiple toasts
  const debouncedShowError = useCallback(
    debounce((message: string) => {
      showError(message);
    }, 100, { leading: true, trailing: false }),
    [showError]
  );

  // Load existing drawing data
  useEffect(() => {
    let unsubscribe: () => void;

    const loadDrawing = async () => {
      try {
        const tileRef = doc(db, "shared_canvas", tilePosition);
        
        // Initial load of existing drawings
        const initialDoc = await getDoc(tileRef);
        if (initialDoc.exists()) {
          const data = initialDoc.data();
          const strokes = data.strokes?.map((stroke: any) => ({
            ...stroke,
            points: Array.from(stroke.points || []).map(Number),
            timestamp: stroke.timestamp?.toDate() || new Date(),
            owner: stroke.owner || '',
            saved: true
          })) || [];
          setLines(strokes);
        }
        
        // Set up real-time updates
        unsubscribe = onSnapshot(tileRef, (doc) => {
          if (!isProcessingSave.current) { // Only update if not a local change
            if (doc.exists()) {
              const data = doc.data();
              const strokes = data.strokes?.map((stroke: any) => ({
                ...stroke,
                points: Array.from(stroke.points || []).map(Number),
                timestamp: stroke.timestamp?.toDate() || new Date(),
                owner: stroke.owner || '',
                saved: true
              })) || [];

              // Keep local unsaved lines and merge with remote changes
              setLines(prevLines => {
                const unsavedLines = prevLines.filter(line => 
                  line.owner === walletPublicKey && !line.saved
                );
                
                // Filter out any saved lines from the current user that are already in strokes
                const filteredStrokes = strokes.filter((stroke: LineElement) => {
                  if (stroke.owner === walletPublicKey) {
                    return !unsavedLines.some(unsaved => 
                      unsaved.timestamp?.getTime() === stroke.timestamp?.getTime()
                    );
                  }
                  return true;
                });
                
                return [...filteredStrokes, ...unsavedLines];
              });
            } else {
              // If document doesn't exist, create it with empty strokes
              setDoc(tileRef, {
                strokes: [],
                updatedAt: new Date()
              }).catch(error => {
                console.error("Error creating initial document:", error);
              });
              setLines([]);
            }
          }
        });
      } catch (error) {
        console.error("Error loading drawing:", error);
      }
    };

    // Load drawings immediately when component mounts or tile position changes
    loadDrawing();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tilePosition, walletPublicKey]);

  // Process save queue
  const processSaveQueue = useCallback(async () => {
    if (isProcessingSave.current || saveQueue.current.length === 0) return;

    try {
      isProcessingSave.current = true;
      setIsSaving(true);

      const tileRef = doc(db, "shared_canvas", tilePosition);
      const tileDoc = await getDoc(tileRef);
      const existingStrokes = tileDoc.exists() ? tileDoc.data().strokes || [] : [];
      
      // Keep all existing strokes that aren't from the current user
      const otherUsersStrokes = existingStrokes.filter(
        (stroke: LineElement) => stroke.owner !== walletPublicKey
      );

      // Get all current user's lines from the current state
      const currentUserStrokes = lines
        .filter(line => line.owner === walletPublicKey)
        .map(line => ({
          ...line,
          points: Array.from(line.points).map(Number),
          timestamp: line.timestamp || new Date(),
          owner: walletPublicKey,
          saved: true
        }));

      // Set isLocalUpdate to true before making the update
      isLocalUpdate.current = true;
      
      await setDoc(tileRef, {
        strokes: [...otherUsersStrokes, ...currentUserStrokes],
        updatedAt: new Date()
      }, { merge: true });

      // Clear the queue after successful save
      saveQueue.current = [];
      
      // Update local lines to mark them as saved
      setLines(prevLines => 
        prevLines.map(line => 
          line.owner === walletPublicKey ? { ...line, saved: true } : line
        )
      );

      // Reset isLocalUpdate after a short delay to ensure the onSnapshot doesn't process this update
      setTimeout(() => {
        isLocalUpdate.current = false;
      }, 100);

    } catch (error) {
      console.error("Error saving drawing:", error);
    } finally {
      isProcessingSave.current = false;
      setIsSaving(false);
    }
  }, [walletPublicKey, tilePosition, lines]);

  // Initialize canvas when wallet is connected
  useEffect(() => {
    if (walletPublicKey) {
      const initializeCanvas = async () => {
        try {
          const tileRef = doc(db, "shared_canvas", tilePosition);
          const docSnap = await getDoc(tileRef);
          
          if (!docSnap.exists()) {
            // Create initial document if it doesn't exist
            await setDoc(tileRef, {
              strokes: [],
              updatedAt: new Date()
            });
          }
        } catch (error) {
          console.error("Error initializing canvas:", error);
        }
      };

      initializeCanvas();
    }
  }, [walletPublicKey, tilePosition]);

  // Queue lines for saving
  const queueLinesForSave = useCallback((linesToSave: LineElement[]) => {
    const unsavedLines = linesToSave.filter(line => 
      line.owner === walletPublicKey && !line.saved
    );
    if (unsavedLines.length > 0) {
      saveQueue.current = unsavedLines;
      processSaveQueue();
    }
  }, [walletPublicKey, processSaveQueue]);

  // Handle mouse up - trigger save when drawing stops
  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    if (lines.length > 0) {
      queueLinesForSave(lines);
    }
    lastEraserErrorTime.current = 0;
  }, [lines, queueLinesForSave]);

  // Save periodically during drawing
  useEffect(() => {
    if (isDrawing) {
      const saveInterval = setInterval(() => {
        if (lines.length > 0) {
          queueLinesForSave(lines);
        }
      }, 2000); // Save every 2 seconds while drawing

      return () => clearInterval(saveInterval);
    }
  }, [isDrawing, lines, queueLinesForSave]);

  // Update canvas size
  useEffect(() => {
    const handleResize = debounce(() => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - 80
      });
    }, 100);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, []);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    setIsDrawing(true);
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (tool === 'eraser') {
      setMousePosition(pos);
      return;
    }

    const newLine: LineElement = {
      points: [pos.x, pos.y],
      color: selectedColor,
      tool: 'pen',
      timestamp: new Date(),
      owner: walletPublicKey,
      ownerDisplayName: displayName,
      saved: false
    };
    
    setLines(prevLines => [...prevLines, newLine]);
  }, [selectedColor, tool, walletPublicKey, displayName]);

  const hideTooltip = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      const tooltipElement = tooltipRef.current;
      if (tooltipElement) {
        const tooltipRect = tooltipElement.getBoundingClientRect();
        const mouseX = mousePosition?.x || 0;
        const mouseY = mousePosition?.y || 0;
        
        // Check if mouse is moving towards or is over the tooltip
        const isOverOrMovingToTooltip = 
          mouseX >= tooltipRect.left &&
          mouseX <= tooltipRect.right &&
          mouseY >= tooltipRect.top &&
          mouseY <= tooltipRect.bottom;

        if (!isOverOrMovingToTooltip) {
          setTooltip(prev => ({ ...prev, visible: false }));
        }
      } else {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    }, 100); // 300ms delay before hiding
  }, [mousePosition]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setMousePosition(pos);

    if (!isDrawing) {
      // Check if mouse is over any line and show tooltip
      const lineUnderCursor = lines.find(line => {
        if (!line || !line.points || line.points.length < 4) return false;
        
        for (let i = 0; i < line.points.length - 2; i += 2) {
          const x1 = line.points[i];
          const y1 = line.points[i + 1];
          const x2 = line.points[i + 2];
          const y2 = line.points[i + 3];
          
          const distance = distanceToLineSegment(pos.x, pos.y, x1, y1, x2, y2);
          if (distance < 5) { // 5px threshold
            return true;
          }
        }
        return false;
      });

      if (lineUnderCursor && lineUnderCursor.owner) {
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
        }

        // Get container position to adjust tooltip position
        const container = containerRef.current?.getBoundingClientRect();
        if (container) {
          const lineId = `${lineUnderCursor.owner}-${lineUnderCursor.timestamp?.getTime()}`;
          setActiveLineId(lineId);

          // Always show the owner's public key in the tooltip
          setTooltip({
            visible: true,
            x: pos.x + container.left,
            y: pos.y + container.top - 40,
            owner: lineUnderCursor.owner,
            ownerDisplayName: lineUnderCursor.ownerDisplayName || '',
            lineId
          });
        }
      } else {
        hideTooltip();
      }
      return;
    }

    if (tool === 'eraser') {
      // Check for lines under eraser that belong to other users
      let hasErasedLines = false;
      let hasTriedToEraseOthers = false;
      // const otherUserLinesUnderEraser = lines.some(line => {
      //   if (line.owner !== walletPublicKey) {
      //     for (let i = 0; i < line.points.length; i += 2) {
      //       const distance = Math.sqrt(
      //         Math.pow(line.points[i] - pos.x, 2) + 
      //         Math.pow(line.points[i + 1] - pos.y, 2)
      //       );
      //       if (distance <= eraserSize / 2) {
      //         hasTriedToEraseOthers = true;
      //         return true;
      //       }
      //     }
      //   }
      //   return false;
      // });

      // Show error message if trying to erase other users' lines - using debounced function
      const currentTime = Date.now();
      if (hasTriedToEraseOthers && currentTime - lastEraserErrorTime.current > 1000) {
        debouncedShowError("Cannot erase other's drawings");
        lastEraserErrorTime.current = currentTime;
      }

      // Only allow erasing own lines
      const updatedLines = lines.map(line => {
        if (line.owner !== walletPublicKey) {
          return line; // Keep other users' lines unchanged
        }
        
        // Check if any point of the line is within eraser radius
        for (let i = 0; i < line.points.length; i += 2) {
          const distance = Math.sqrt(
            Math.pow(line.points[i] - pos.x, 2) + 
            Math.pow(line.points[i + 1] - pos.y, 2)
          );
          if (distance <= eraserSize / 2) {
            hasErasedLines = true;
            return { ...line, erase: true }; // Mark line for deletion
          }
        }
        return line;
      });

      // Filter out erased lines and update state
      const newLines = updatedLines.filter(line => !line.erase);
      
      if (hasErasedLines) {
        setLines(newLines);
        // Force immediate save when erasing
        const tileRef = doc(db, "shared_canvas", tilePosition);
        setDoc(tileRef, {
          strokes: newLines.map(line => ({
            ...line,
            points: Array.from(line.points).map(Number),
            timestamp: line.timestamp || new Date(),
            owner: line.owner,
            saved: true
          })),
          updatedAt: new Date()
        }, { merge: true }).catch(error => {
          console.error("Error saving erased lines:", error);
        });
      }
      return;
    }

    // Only allow extending own lines
    const lastLine = lines[lines.length - 1];
    if (lastLine && lastLine.owner === walletPublicKey) {
      setLines(prevLines => {
        const updatedLastLine = {...prevLines[prevLines.length - 1]};
        updatedLastLine.points = [...updatedLastLine.points, pos.x, pos.y];
        return [...prevLines.slice(0, -1), updatedLastLine];
      });
    }
  }, [isDrawing, tool, eraserSize, lines, walletPublicKey, debouncedShowError, queueLinesForSave]);

  // Helper function to calculate distance from point to line segment
  const distanceToLineSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  // Color palette
  const colors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#FFC0CB', // Pink
  ];

  const handleTooltipButtonClick = useCallback((ownerKey: string): void => {
    setSelectedOwnerAddress(ownerKey);
    setIsModalOpen(true);
    setTooltip((prev: TooltipState) => ({ ...prev, visible: false }));
  }, []);

  // Show auth modal when user is not logged in
  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
    }
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      showError('Failed to authenticate. Please try again.');
      console.error('Authentication error:', error);
    }
  };

  return (
    <CanvasContainer $theme={theme} ref={containerRef}>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
        limit={1}
        toastStyle={{
          backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
          color: theme === 'dark' ? '#FFFFFF' : '#000000',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
          boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      />
      <StageContainer>
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onMouseleave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{ display: 'block' }}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={`${i}-${line.timestamp?.getTime()}`}
                points={line.points}
                stroke={line.color}
                strokeWidth={5}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
              />
            ))}
            {tool === 'eraser' && mousePosition && (
              <Circle
                x={mousePosition.x}
                y={mousePosition.y}
                radius={eraserSize / 2}
                stroke="#000"
                strokeWidth={1}
                dash={[5, 5]}
                fill="rgba(255, 255, 255, 0.3)"
              />
            )}
          </Layer>
        </Stage>
      </StageContainer>

      {/* HTML Tooltip */}
      {tooltip.visible && tooltip.owner && (
        <TooltipContainer
          ref={tooltipRef}
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
          onMouseEnter={() => {
            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            hideTooltip();
          }}
        >
          <TooltipContent>
            <PublicKey>{tooltip.owner.slice(0,5)}...</PublicKey>
            {tooltip.owner === publicKey ? (
              <YouLabel>You</YouLabel>
            ) : (
              <CopyButton onClick={() => handleTooltipButtonClick(tooltip.owner)}>
                Tip Artist
              </CopyButton>
            )}
          </TooltipContent>
        </TooltipContainer>
      )}

      <ColorPalette>
        <ToolsSection>
          <ToolButton
            $isSelected={tool === 'pen'}
            onClick={() => setTool('pen')}
            title="Pen Tool"
          >
            <FaPencilAlt />
          </ToolButton>
          <ToolButton
            $isSelected={tool === 'eraser'}
            onClick={() => setTool('eraser')}
            title="Eraser Tool"
          >
            <FaEraser />
          </ToolButton>
          {tool === 'eraser' && (
            <EraserSizeSlider
              type="range"
              min="10"
              max="50"
              value={eraserSize}
              onChange={(e) => setEraserSize(Number(e.target.value))}
            />
          )}
        </ToolsSection>
        <Divider />
        <ColorSection theme={theme}>
        {colors.map((color) => (
          <ColorButton
            key={color}
              $color={color}
              $isSelected={selectedColor === color && tool === 'pen'}
              $theme={theme}
              onClick={() => {
                setSelectedColor(color);
                setTool('pen');
              }}
          />
        ))}
        </ColorSection>
      </ColorPalette>

      <ToastMessage $visible={showToast}>
        Public key copied to clipboard!
      </ToastMessage>

      {/* Add saving indicator */}
      {isSaving && (
        <SavingIndicator>
          Saving...
        </SavingIndicator>
      )}

      {/* Add Modal component */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Send Tip"
        receiverAddress={selectedOwnerAddress}
      />

      {/* Auth Modal */}
      <AuthModal $isOpen={showAuthModal}>
        <ModalContent $theme={theme}>
          <CloseButton 
            onClick={() => navigate('/')}
            $theme={theme}
          >
            ×
          </CloseButton>
          <ModalTitle $theme={theme}>
            Authentication Required
          </ModalTitle>
          <ModalText $theme={theme}>
            Please log in to access the collaborative canvas and start creating!
          </ModalText>
          <ModalButton onClick={handleSignIn}>
            Log in with CivicAuth
          </ModalButton>
        </ModalContent>
      </AuthModal>
    </CanvasContainer>
  );
};

const CanvasContainer = styled.div<{ $theme: 'light' | 'dark' }>`
  position: relative;
  width: 100%;
  height: calc(100vh - 80px);
  background-color: ${props => 
    props.$theme === 'light' ? 'var(--light-background)' : 'var(--dark-background)'};
  overflow: hidden;
`;

const StageContainer = styled.div`
  width: 100%;
  height: 100%;
  canvas {
    cursor: crosshair;
  }
`;

const ColorPalette = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 15px;
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const ToolsSection = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Divider = styled.div`
  width: 1px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.1);
`;

const ColorSection = styled.div<{ theme: 'light' | 'dark', $isSelected?: boolean }>`
  display: flex;
  gap: 10px;
  align-items: center;
  border: 2px solid ${props => props.$isSelected ? '#000' : 'transparent'};
  background-color: ${props => props.$isSelected ? 'rgba(0, 0, 0, 0.1)' : 'transparent'};
`;

const ToolButton = styled.button<{ $isSelected: boolean }>`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 2px solid ${props => props.$isSelected ? '#000' : 'transparent'};
  background-color: ${props => props.$isSelected ? 'rgba(0, 0, 0, 0.1)' : 'transparent'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  svg {
    width: 16px;
    height: 16px;
    color: #666;
  }
`;

const EraserSizeSlider = styled.input`
  width: 80px;
  margin: 0;
  height: 4px;
  border-radius: 2px;
  /* -webkit-appearance: none; */
  background: rgba(0, 0, 0, 0.1);

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #666;
    cursor: pointer;
    border: none;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #666;
    cursor: pointer;
    border: none;
  }
`;

const ColorButton = styled.button<{ $color: string; $isSelected: boolean; $theme: 'light' | 'dark' }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid ${props => props.$isSelected ? '#000' : 'transparent'};
  background-color: ${props => props.$color};
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: ${props => props.$isSelected ? '0 0 5px rgba(0,0,0,0.5)' : 'none'};
  padding: 0;

  &:hover {
    transform: scale(1.1);
  }

  ${props => props.$color === '#FFFFFF' && `
    border: 1px solid ${props.$theme === 'light' ? '#ddd' : '#666'};
  `}
`;

const ToastMessage = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(76, 175, 80, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

const TooltipContainer = styled.div`
  position: fixed;
  z-index: 1000;
  transform: translate(-50%, -100%);
  margin-top: -10px;
`;

const TooltipContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 8px 12px;
  border-radius: 5px;
  white-space: nowrap;
  max-width: 400px;
  overflow: hidden;
`;

const PublicKey = styled.div`
  color: white;
  font-size: 12px;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CopyButton = styled.button`
  background-color: #4CAF50;
  border: none;
  border-radius: 4px;
  padding: 3px 15px;
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
  transition: background-color 0.2s;

  &:hover {
    background-color: #45a049;
  }

  &:active {
    background-color: #3d8b40;
  }
`;

const SavingIndicator = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1000;
`;

const YouLabel = styled.span`
    background-color: #4B5563;
    color: white;
    padding: 3px 15px;
    border-radius: 4px;
    font-size: 14px;
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
  background-color: var(--light-primary);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--light-secondary);
  }
`;

const CloseButton = styled.button<{ $theme: 'light' | 'dark' }>`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.$theme === 'light' ? 'var(--light-text)' : 'var(--dark-text)'};
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

export default Canvas;