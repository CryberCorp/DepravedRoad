import React, { useState, useEffect, useCallback } from 'react';
import { register, login } from './services/api';
import { Network, OrdConnectProvider, OrdConnectKit, useOrdConnect, useSignMessage } from '@ordzaar/ord-connect';

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const { address, wallet } = useOrdConnect();
  const { signMsg, error: signMessageError } = useSignMessage();
  const [signature, setSignature] = useState('');

  useEffect(() => {
    if (address && address.payments) {
      setMessage(address.payments);
    } else {
      setMessage('No address');
    }
  }, [address]);

  const handleSignMessage = useCallback(async () => {
    if (!address || !address.payments) {
      setMessage('Please connect your wallet before signing.');
      return;
    }
    const walletAddress = address.payments;
    try {
      const signedMessage = await signMsg(walletAddress, walletAddress);
      setSignature(signedMessage);
      setMessage('Message signed successfully');
    } catch (error) {
      setMessage('Signature error: ' + error.message);
    }
  }, [address, signMsg]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!signature) {
      setMessage('Please sign the message before registering.');
      return;
    }
    if (!address || !address.payments) {
      setMessage('Please connect your wallet before registering.');
      return;
    }
    const walletAddress = address.payments;
    try {
      const response = await register(username, walletAddress, walletAddress, signature);
      setMessage('User registered successfully');
    } catch (error) {
      setMessage('Registration error: ' + error.message);
    }
  };

  const handleLogin = async () => {
    if (!address || !address.payments) {
      setMessage('Please connect your wallet before logging in.');
      return;
    }
    const walletAddress = address.payments;
    try {
      const signedMessage = await signMsg(walletAddress, walletAddress);
      const response = await login(walletAddress, signedMessage, walletAddress);
      setMessage('User logged in successfully');
    } catch (error) {
      if (error.response && error.response.data.error === 'User not found') {
        setMessage('User not found, please register.');
      } else {
        setMessage('Login error: ' + error.message);
      }
    }
  };

  return (
    <div>
      <OrdConnectKit />
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Twitter Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <button type="button" onClick={handleSignMessage}>Sign Message</button>
        <button type="submit">Register with Twitter</button>
      </form>

      <h1>Login</h1>
      <button onClick={handleLogin}>Login with Wallet</button>

      {message && <p>{message}</p>}
      <p>Connected Wallet Address: {address && address.payments ? address.payments : 'No wallet connected'}</p>
      {signMessageError && <p>Sign Message Error: {signMessageError}</p>}
    </div>
  );
}

export default App;
