import React, { useState } from 'react';
import axios from 'axios';

interface MemeRatingProps {
  memeId: string;
}

const MemeRating: React.FC<MemeRatingProps> = ({ memeId }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [used, setUsed] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const submitRating = async () => {
    try {
      await axios.post('/api/rate-meme', { memeId, rating, used });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting rating', error);
    }
  };

  return (
    <div>
      <h3>Rate this meme:</h3>
      <div>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            onClick={() => setRating(star)}
            style={{ cursor: 'pointer', color: (rating !== null && rating >= star) ? 'gold' : 'grey' }}
          >
            ★
          </span>
        ))}
      </div>
      {rating && (
        <div>
          <h4>Did you use this meme?</h4>
          <button onClick={() => setUsed(true)}>Yes</button>
          <button onClick={() => setUsed(false)}>No</button>
        </div>
      )}
      {used !== null && !submitted && (
        <button onClick={submitRating}>Submit Rating</button>
      )}
      {submitted && <p>Thank you for your feedback!</p>}
    </div>
  );
};

export default MemeRating;
