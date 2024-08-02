import React, { useState } from 'react';
import axios from 'axios';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import './MemeGenerator.css';

// Initialize OpenTelemetry in the frontend
const provider = new WebTracerProvider();
const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4317/v1/traces',
});
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation(),
    new XMLHttpRequestInstrumentation(),
  ],
});

// Modal Component
const Modal: React.FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const MemeGenerator: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [memeId, setMemeId] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [used, setUsed] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const tracer = trace.getTracer('default');

  const generateMeme = async () => {
    setLoading(true);
    setMessage('');
    setImageSrc(null);
    setMemeId(null);
    setRating(null);
    setUsed(null);
    setSubmitted(false);
    setShowModal(false);

    try {
      const response = await axios.post('/createPicture', {}, { responseType: 'blob' });
      const imageUrl = URL.createObjectURL(response.data);
      setLoading(false);
      setImageSrc(imageUrl);
      setMessage('Meme generated successfully!');
      setMemeId('generated-meme-id'); // Set a dummy meme ID for now
    } catch (error) {
      console.error('Error generating meme:', error);
      setLoading(false);
      setMessage('Failed to generate meme. Please try again.');
    }
  };

  const submitRating = async () => {
    const span = tracer.startSpan('submit-rating');
    console.log('submitRating called');
    console.log('memeId:', memeId, 'rating:', rating, 'used:', used);
    try {
      if (memeId && rating !== null && used !== null) {
        span.setAttribute('memeId', memeId);
        span.setAttribute('rating', rating);
        span.setAttribute('used', used);

        await axios.post('/rate-meme', { memeId, rating, used });
        setSubmitted(true);
        setModalMessage('Thank you for your feedback!');
        setShowModal(true); // Show modal after submitting the rating
        span.addEvent('rating submitted', { memeId, rating, used });
        span.setStatus({ code: SpanStatusCode.OK });
        console.log('Rating submitted');
      } else {
        console.error('Missing memeId, rating, or used status');
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Missing memeId, rating, or used status' });
      }
    } catch (error) {
      console.error('Error submitting rating', error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Error submitting rating' });
    } finally {
      span.end();
    }
  };

  return (
    <div className="content">
      <h1>Meminator 10114</h1>
      <p>
        <button onClick={generateMeme}>GO</button>
      </p>
      {message && <div id="message">{message}</div>}
      <div className="content">
        {loading && <img id="loading-meme" src="/loading-meme.gif" alt="Loading Meme" />}
        {imageSrc && <img id="picture" src={imageSrc} alt="Meme" />}
      </div>
      {imageSrc && !submitted && (
        <>
          <div>
            <h3>Rate this meme:</h3>
            <div>
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  style={{ cursor: 'pointer', color: rating !== null && rating >= star ? 'gold' : 'grey' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4>Did you use this meme?</h4>
            <button 
              onClick={() => setUsed(true)} 
              style={{ backgroundColor: used === true ? 'lightgreen' : 'white' }}
            >
              Yes
            </button>
            <button 
              onClick={() => setUsed(false)} 
              style={{ backgroundColor: used === false ? 'lightcoral' : 'white' }}
            >
              No
            </button>
          </div>
          {used !== null && (
            <button onClick={submitRating}>Submit Rating</button>
          )}
        </>
      )}
      {showModal && (
        <Modal
          message={modalMessage}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default MemeGenerator;
