import React, { useEffect, useState } from "react"
import { useTheme } from "../hooks/useThemeContext"
import styled from "styled-components"
import Confetti from "react-confetti"
import { useWalletContext } from "../hooks/useWalletContext"
import { useToaster } from "../hooks/useToaster"
import { PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js"
import { useUser } from "@civic/auth-web3/react"
import { Buffer } from 'buffer';


window.Buffer = Buffer;

declare global {
    interface Window {
        solana: {
            signTransaction(transaction: Transaction): Promise<Transaction>;
        };
        Buffer: typeof Buffer;
    }
}

interface ModalProps {
    isOpen: boolean,
    onClose: () => void,
    title: string,
    receiverAddress: string,
    children?: React.ReactNode,
}

interface SolanaWallet {
    solana: {
        address: string;
        wallet: {
            publicKey: PublicKey;
            signTransaction(transaction: Transaction): Promise<Transaction>;
        };
    };
}

export const Modal = ({ isOpen, onClose, title, receiverAddress }: ModalProps) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [showConfetti, setShowConfetti] = useState<boolean>(false);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [amount, setAmount] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
    const { publicKey, connection, balance } = useWalletContext();
    const { showSuccess, showError } = useToaster();
    const userContext = useUser();

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset modal state when opened with a new recipient
    useEffect(() => {
        if (isOpen) {
            setAmount("");
            setError(null);
            setTransactionSignature(null);
            setShowConfetti(false);
        }
    }, [isOpen, receiverAddress]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow numbers and decimals
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
            setError(null);
        }
    };

    const validateTransaction = (): boolean => {
        if (!amount || parseFloat(amount) <= 0) {
            setError("Please enter a valid amount");
            return false;
        }

        if (!balance || parseFloat(amount) > balance) {
            setError("Insufficient balance");
            return false;
        }

        return true;
    };

    const handleSendTip = async () => {
        if (!validateTransaction()) return;

        try {
            setIsProcessing(true);
            setError(null);
            setTransactionSignature(null);

            if (!publicKey) {
                throw new Error("Wallet not connected");
            }

            const senderPubKey = new PublicKey(publicKey);
            const receiverPubKey = new PublicKey(receiverAddress);
            const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: senderPubKey,
                    toPubkey: receiverPubKey,
                    lamports,
                })
            );

            // Get the latest blockhash
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = senderPubKey;

            // Get the wallet from Civic Auth context
            const walletContext = userContext as unknown as SolanaWallet;
            if (!walletContext.solana?.wallet) {
                throw new Error("Wallet not found in Civic Auth context");
            }

            // Sign the transaction using Civic Auth wallet
            const signedTransaction = await walletContext.solana.wallet.signTransaction(transaction);

            // Send the signed transaction
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            
            // Confirm transaction
            await connection.confirmTransaction(signature);
            
            setTransactionSignature(signature);
            showSuccess("Tip sent successfully!");
            setShowConfetti(true);
            setTimeout(() => {
                setShowConfetti(false);
            }, 7000);
        } catch (err) {
            console.error("Transaction error:", err);
            setError(err instanceof Error ? err.message : "Failed to send tip");
            showError("Failed to send tip");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setAmount("");
        setError(null);
        setTransactionSignature(null);
        setShowConfetti(false);
    };

    if (!isOpen) return null;

    return (
        <>
            {showConfetti && (
                <ConfettiContainer>
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={500}
                    />
                </ConfettiContainer>
            )}
            <ModalOverlay isOpen={isOpen} onClick={onClose}>
                <ModalContent
                    $isDark={isDark}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ModalHeader>
                        <ModalTitle $isDark={isDark}>{title}</ModalTitle>
                        <CloseButton $isDark={isDark} onClick={onClose}>
                            ✕
                        </CloseButton>
                    </ModalHeader>

                    <TipForm>
                        {transactionSignature ? (
                            <SuccessContainer>
                                <SuccessTitle>Transaction Successful!</SuccessTitle>
                                <TransactionLink 
                                    href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    $isDark={isDark}
                                >
                                    View on Solana Explorer
                                </TransactionLink>
                                <SendButton
                                    onClick={handleReset}
                                    $isDark={isDark}
                                >
                                    Send Another Tip
                                </SendButton>
                            </SuccessContainer>
                        ) : (
                            <>
                                <InputGroup>
                                    <Label $isDark={isDark}>Amount (SOL)</Label>
                                    <Input
                                        type="text"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        placeholder="0.00"
                                        $isDark={isDark}
                                        disabled={isProcessing}
                                    />
                                </InputGroup>

                                <InputGroup>
                                    <Label $isDark={isDark}>Recipient</Label>
                                    <RecipientAddress $isDark={isDark}>
                                        {`${receiverAddress.slice(0, 8)}...${receiverAddress.slice(-8)}`}
                                    </RecipientAddress>
                                </InputGroup>

                                {error && <ErrorMessage>{error}</ErrorMessage>}

                                <SendButton
                                    onClick={handleSendTip}
                                    disabled={isProcessing}
                                    $isDark={isDark}
                                >
                                    {isProcessing ? "Processing..." : "Send Tip"}
                                </SendButton>
                            </>
                        )}
                    </TipForm>
                </ModalContent>
            </ModalOverlay>
        </>
    );
};

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div<{ $isDark: boolean }>`
  background-color: ${props => props.$isDark ? '#1a1a1a' : 'white'};
  border: 1px solid ${props => props.$isDark ? '#333' : '#e5e7eb'};
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2<{ $isDark: boolean }>`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.$isDark ? 'white' : '#1f2937'};
  margin: 0;
`;

const CloseButton = styled.button<{ $isDark: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.$isDark ? 'white' : '#1f2937'};
  }
`;

export const SuccessMessage = styled.div`
  padding: 1rem;
  max-width: 100%;
`;

export const SuccessTitle = styled.h3`
  color: #10B981;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
`;

export const TokenInfo = styled.p<{ $isDark: boolean }>`
  margin: 0.5rem 0;
  color: ${props => props.$isDark ? '#E5E7EB' : '#374151'};
`;

export const ShareLink = styled.a<{ $isDark: boolean }>`
  display: block;
  word-break: break-all;
  color: #3B82F6;
  text-decoration: none;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: ${props => props.$isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
  border-radius: 0.375rem;
  border: 1px solid ${props => props.$isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
  
  &:hover {
    text-decoration: underline;
    background-color: ${props => props.$isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
  }
`;

export const AddressMono = styled.span`
  font-family: monospace;
`;

const ConfettiContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10000;
`;

const TipForm = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const Label = styled.label<{ $isDark: boolean }>`
    font-size: 0.875rem;
    font-weight: 500;
    color: ${props => props.$isDark ? '#E5E7EB' : '#374151'};
`;

const Input = styled.input<{ $isDark: boolean }>`
    padding: 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid ${props => props.$isDark ? '#4B5563' : '#D1D5DB'};
    background-color: ${props => props.$isDark ? '#374151' : '#F9FAFB'};
    color: ${props => props.$isDark ? '#F9FAFB' : '#111827'};
    font-size: 1rem;
    width: 100%;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const RecipientAddress = styled.div<{ $isDark: boolean }>`
    padding: 0.5rem;
    border-radius: 0.375rem;
    background-color: ${props => props.$isDark ? '#4B5563' : '#F3F4F6'};
    color: ${props => props.$isDark ? '#E5E7EB' : '#374151'};
    font-family: monospace;
    font-size: 0.875rem;
`;

const ErrorMessage = styled.div`
    color: #EF4444;
    font-size: 0.875rem;
    margin-top: 0.5rem;
`;

const SendButton = styled.button<{ $isDark: boolean }>`
    padding: 0.75rem;
    border-radius: 0.375rem;
    background-color: #3B82F6;
    color: white;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    margin-top: 0.5rem;

    &:hover:not(:disabled) {
        background-color: #2563EB;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const SuccessContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
    padding: 1rem 0;
`;

const TransactionLink = styled.a<{ $isDark: boolean }>`
    color: #3B82F6;
    text-decoration: none;
    padding: 0.5rem 1rem;
    background-color: ${props => props.$isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
    border-radius: 0.375rem;
    border: 1px solid ${props => props.$isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    transition: all 0.2s;

    &:hover {
        text-decoration: underline;
        background-color: ${props => props.$isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    }
`;
