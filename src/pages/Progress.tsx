import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/endpoints';
import type { VideoStatusResponse } from '../api/types';

const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function Progress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VideoStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) return;
      try {
        // Prefer polling for reliability across environments
        await api.video.pollVideoStatus(
          id,
          (s) => {
            if (cancelled) return;
            setStatus(s);
          },
          3000,
          15 * 60 * 1000
        ).then((finalStatus) => {
          if (cancelled) return;
          setStatus(finalStatus);
          // Small delay so user sees 100%
          setTimeout(() => navigate('/history'), 800);
        }).catch((e) => {
          if (cancelled) return;
          setError(e?.message || 'Failed to get progress');
        });
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Failed to start progress');
      }
    }

    run();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const progressValue = Math.max(0, Math.min(100, status?.progress ?? (status?.status === 'completed' ? 100 : 0)));

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-xl mx-auto space-y-6"
    >
      <div className="card">
        <h1 className="text-xl font-semibold text-white">Generating your video</h1>
        <p className="text-gray-400 mt-1">Job ID: <span className="text-gray-300">{id}</span></p>

        <div className="mt-4">
          <div className="w-full bg-bg-tertiary rounded h-3 overflow-hidden border border-bg-quaternary">
            <div
              className="bg-neural-cyan h-3 transition-all"
              style={{ width: `${progressValue}%` }}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressValue}
              role="progressbar"
              title={`Progress ${progressValue}%`}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
            <span>Status: <span className="capitalize text-gray-300">{status?.status || 'starting'}</span></span>
            <span>{progressValue}%</span>
          </div>
        </div>

        {status?.message && (
          <p className="text-sm text-gray-400 mt-3">{status.message}</p>
        )}

        {status?.status === 'completed' && status.video_url && (
          <div className="mt-4">
            <a
              href={status.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
            >
              View Downloaded Video
            </a>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-400">{error}</div>
        )}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="px-4 py-2 bg-bg-tertiary hover:bg-bg-quaternary text-white rounded"
        >
          Go to History
        </button>
      </div>
    </motion.div>
  );
}
