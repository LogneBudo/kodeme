import React, { useState } from 'react';
import { validateInvitation, redeemInvitation } from '../../api/invitations';

const JoinOrganization: React.FC = () => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle'|'validating'|'success'|'error'>('idle');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('validating');
    setError('');
    const invitation = await validateInvitation(code);
    if (!invitation) {
      setStatus('error');
      setError('Invalid or expired code.');
      return;
    }
    // Replace with actual user id
    const user_id = 'CURRENT_USER_ID';
    const success = await redeemInvitation(code, user_id);
    if (success) {
      setStatus('success');
    } else {
      setStatus('error');
      setError('Could not redeem code.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 32 }}>
      <h2>Join Organization</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="invite-code">Invitation Code</label>
        <input
          id="invite-code"
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{ width: '100%', marginBottom: 16 }}
          required
        />
        <button type="submit" disabled={status === 'validating'}>
          {status === 'validating' ? 'Validating...' : 'Join'}
        </button>
      </form>
      {status === 'error' && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      {status === 'success' && <div style={{ color: 'green', marginTop: 16 }}>Successfully joined organization!</div>}
    </div>
  );
};

export default JoinOrganization;
