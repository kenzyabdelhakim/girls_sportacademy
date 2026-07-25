import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  ScanLine,
  Camera,
  AlertCircle,
  RefreshCw,
  Video,
  Zap,
  Clock,
} from 'lucide-react';
import { getAllStudents } from '../services/studentService';
import { markAttendance, checkAttendanceToday } from '../services/attendanceService';
import toast from 'react-hot-toast';
import { useLang } from '../contexts/LanguageContext';

const Scanner = () => {
  const { t } = useLang();
  const [scanning, setScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [resultType, setResultType] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const isTickingRef = useRef(false);
  const detectorRef = useRef(null);
  const facingRef = useRef('environment');
  // Always-current reference to scanFrame (avoids stale closure in setInterval)
  const scanFrameRef = useRef(null);

  useEffect(() => {
    if ('BarcodeDetector' in window) {
      try {
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch {}
    }
    return () => stopEverything();
  }, []);

  const stopEverything = () => {
    activeRef.current = false;
    processingRef.current = false;
    isTickingRef.current = false;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const onQRDetected = async (decodedText) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const students = await getAllStudents();
      const student = students.find(s => s.studentId === decodedText);

      if (!student) {
        setResultType('error');
        setScanResult({ message: t('scanner.unknownQR'), details: t('scanner.noAthleteFor', { id: decodedText }) });
        playTone(330);
      } else {
        const marked = await checkAttendanceToday(student.studentId);
        if (marked) {
          setResultType('warning');
          setScanResult({ message: t('scanner.alreadyCheckedIn'), details: t('scanner.alreadyRecorded', { name: student.fullName }), student });
          playTone(440);
        } else {
          await markAttendance(student);
          setScanCount(c => c + 1);
          setResultType('success');
          setScanResult({ message: t('scanner.checkedIn'), details: t('scanner.welcome', { name: student.fullName }), student });
          playTone(880);
        }
      }
    } catch (err) {
      setResultType('error');
      setScanResult({ message: t('scanner.errorTitle'), details: err.message || t('scanner.failedProcess') });
      playTone(220);
    }

    setTimeout(() => {
      setScanResult(null);
      setResultType(null);
      processingRef.current = false;
    }, 3000);
  };

  const scanFrame = async () => {
    if (!activeRef.current || processingRef.current || isTickingRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return;

    isTickingRef.current = true;
    let qrData = null;

    try {
      // BarcodeDetector: hardware-accelerated on Android Chrome
      if (detectorRef.current) {
        const codes = await detectorRef.current.detect(video);
        if (codes.length > 0) qrData = codes[0].rawValue;
      }
      // jsQR fallback: works everywhere including iOS Safari
      if (!qrData) {
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.floor(video.videoWidth * scale);
        canvas.height = Math.floor(video.videoHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code?.data) qrData = code.data;
      }
    } catch {}

    isTickingRef.current = false;

    if (qrData && activeRef.current) {
      onQRDetected(qrData);
    }
  };
  // Keep scanFrameRef current on every render
  scanFrameRef.current = scanFrame;

  // Callback ref — fires when <video> mounts/unmounts inside the active scanner view
  const attachVideo = useCallback((node) => {
    videoRef.current = node;
    if (!node || !streamRef.current) return;
    node.srcObject = streamRef.current;
    node.play()
      .then(() => {
        activeRef.current = true;
        intervalRef.current = setInterval(() => scanFrameRef.current(), 150);
      })
      .catch((err) => {
        console.error('[Scanner] video.play() failed:', err);
        setIsInitializing(false);
        setScanning(false);
        setPermissionError('unknown');
      });
  }, []); // stable: uses refs only

  const startScanner = async (facing) => {
    const mode = facing ?? facingRef.current;
    setPermissionError(null);
    setScanResult(null);
    setResultType(null);
    setIsInitializing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;

      // Enumerate cameras after permission granted (labels are now visible)
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setHasMultipleCameras(devices.filter(d => d.kind === 'videoinput').length > 1);
      }).catch(() => {});

      setScanning(true);
      setIsInitializing(false);
      // <video> mounts on next render → attachVideo fires → plays + starts interval
    } catch (err) {
      stopEverything();
      setIsInitializing(false);

      const msg = String(err).toLowerCase();
      const secure = window.location.protocol === 'https:' ||
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';

      if (!secure) {
        setPermissionError('https_required');
      } else if (msg.includes('permission') || msg.includes('notallowed') || msg.includes('denied')) {
        setPermissionError('camera_denied');
        toast.error(t('scanner.camDeniedToast'));
      } else if (msg.includes('in use') || msg.includes('notreadable')) {
        setPermissionError('in_use');
        toast.error(t('scanner.busy'));
      } else if (msg.includes('not found') || msg.includes('notfound')) {
        setPermissionError('no_camera');
        toast.error(t('scanner.noCamera'));
      } else {
        setPermissionError('unknown');
        console.error('[Scanner]', err);
      }
    }
  };

  const stopScanner = () => {
    stopEverything();
    setScanning(false);
    setScanResult(null);
    setResultType(null);
  };

  const restartScanner = async () => {
    stopEverything();
    setScanning(false);
    await new Promise(r => setTimeout(r, 300));
    startScanner();
  };

  const switchCamera = async () => {
    const next = facingRef.current === 'environment' ? 'user' : 'environment';
    facingRef.current = next;
    stopEverything();
    setScanning(false);
    await new Promise(r => setTimeout(r, 300));
    startScanner(next);
  };

  const playTone = (freq) => {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.4);
      osc.start(); osc.stop(ac.currentTime + 0.4);
    } catch {}
  };

  const boxSize = Math.max(180, Math.min(260, Math.floor(Math.min(window.innerWidth, 640) * 0.65)));

  const resultColors = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', glow: '0 0 40px rgba(16,185,129,0.25)' },
    warning: { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.3)',  glow: '0 0 40px rgba(251,191,36,0.20)'  },
    error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',   glow: '0 0 40px rgba(239,68,68,0.25)'  },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Hidden canvas — only used by jsQR for pixel extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t('scanner.title')}</h1>
          <p className="page-subtitle">{t('scanner.subtitle')}</p>
        </div>
        {scanCount > 0 && (
          <div className="badge-green flex items-center gap-2 flex-shrink-0">
            <CheckCircle size={13} />
            {scanCount} {t('scanner.scanned')}
          </div>
        )}
      </div>

      {/* Main Scanner Card */}
      <motion.div
        className="glass-card overflow-hidden"
        style={{ boxShadow: scanning ? '0 0 60px rgba(236, 72, 153,0.1)' : undefined }}
      >
        {/* ── Idle ── */}
        {!scanning && !isInitializing && (
          <div className="p-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(219, 39, 119,0.2), rgba(236, 72, 153,0.2))', border: '1px solid rgba(236, 72, 153,0.3)' }}
            >
              <Camera size={36} style={{ color: '#EC4899' }} />
            </motion.div>

            <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{t('scanner.readyToScan')}</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {t('scanner.readyHint')}
            </p>

            {permissionError === 'https_required' && (
              <div className="mb-6 p-4 rounded-xl text-left" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={15} style={{ color: '#ef4444' }} />
                  <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{t('scanner.httpsRequired')}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('scanner.httpsHint')}</p>
              </div>
            )}
            {permissionError === 'camera_denied' && (
              <div className="mb-6 p-4 rounded-xl text-left" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={15} style={{ color: '#F59E0B' }} />
                  <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>{t('scanner.camDenied')}</span>
                </div>
                <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                  <li>{t('scanner.denyTip1')}</li>
                  <li>{t('scanner.denyTip2')}</li>
                  <li>{t('scanner.denyTip3')}</li>
                </ul>
              </div>
            )}
            {(permissionError === 'in_use' || permissionError === 'unknown' || permissionError === 'no_camera') && (
              <div className="mb-6 p-4 rounded-xl text-left" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {permissionError === 'in_use' ? t('scanner.busy') :
                   permissionError === 'no_camera' ? t('scanner.noCamera') :
                   t('scanner.cantOpen')}
                </p>
              </div>
            )}

            <motion.button
              onClick={() => startScanner()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary px-8 py-3 text-base"
            >
              <ScanLine size={20} />
              <span>{permissionError ? t('scanner.tryAgain') : t('scanner.startScanner')}</span>
            </motion.button>

            <div className="mt-8 p-4 rounded-xl text-left" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Zap size={13} style={{ color: '#EC4899' }} /> {t('scanner.tips')}
              </p>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>{t('scanner.tip1')}</li>
                <li>{t('scanner.tip2')}</li>
                <li>{t('scanner.tip3')}</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Initializing ── */}
        {isInitializing && (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full mb-6"
              style={{ border: '3px solid rgba(236, 72, 153,0.15)', borderTop: '3px solid #EC4899' }}
            />
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{t('scanner.openingCamera')}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('scanner.allowWhenPrompted')}</p>
          </div>
        )}

        {/* ── Active Scanner ── */}
        {scanning && !isInitializing && (
          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#22C55E' }}
                />
                <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>{t('scanner.live')}</span>
              </div>
              <div className="flex items-center gap-2">
                {hasMultipleCameras && (
                  <motion.button onClick={switchCamera} whileTap={{ scale: 0.95 }} className="btn-secondary text-xs py-1.5 px-3">
                    <Video size={13} /> {t('scanner.flip')}
                  </motion.button>
                )}
                <motion.button onClick={restartScanner} whileTap={{ scale: 0.95 }} className="btn-secondary text-xs py-1.5 px-3">
                  <RefreshCw size={13} />
                </motion.button>
                <motion.button onClick={stopScanner} whileTap={{ scale: 0.95 }} className="btn-danger text-xs py-1.5 px-3">
                  {t('scanner.stop')}
                </motion.button>
              </div>
            </div>

            {/* Camera feed — <video> controlled entirely by us */}
            <div className="relative bg-black" style={{ minHeight: 280 }}>
              <video
                ref={attachVideo}
                playsInline
                muted
                autoPlay
                style={{ width: '100%', height: 'auto', maxHeight: '65vh', display: 'block', objectFit: 'cover' }}
              />

              {/* Corner bracket overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative" style={{ width: boxSize, height: boxSize }}>
                  {[['top-0 left-0', 'border-t-2 border-l-2 rounded-tl-xl'],
                    ['top-0 right-0', 'border-t-2 border-r-2 rounded-tr-xl'],
                    ['bottom-0 left-0', 'border-b-2 border-l-2 rounded-bl-xl'],
                    ['bottom-0 right-0', 'border-b-2 border-r-2 rounded-br-xl'],
                  ].map(([pos, cls], i) => (
                    <div key={i} className={`absolute ${pos} w-8 h-8 ${cls}`} style={{ borderColor: '#EC4899' }} />
                  ))}
                  <motion.div
                    animate={{ top: ['8%', '92%', '8%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', left: 8, right: 8, height: 2,
                      background: 'linear-gradient(90deg, transparent, #EC4899, transparent)',
                      boxShadow: '0 0 8px #EC4899',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Scan Result */}
            <AnimatePresence>
              {scanResult && resultType && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="m-4 p-4 rounded-xl"
                  style={{
                    background: resultColors[resultType].bg,
                    border: `1px solid ${resultColors[resultType].border}`,
                    boxShadow: resultColors[resultType].glow,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {resultType === 'success'
                      ? <CheckCircle size={24} style={{ color: '#22C55E', flexShrink: 0 }} />
                      : resultType === 'warning'
                      ? <AlertCircle size={24} style={{ color: '#F59E0B', flexShrink: 0 }} />
                      : <XCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{scanResult.message}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{scanResult.details}</p>
                      {scanResult.student && (
                        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #DB2777, #F9A8D4)', color: '#fff' }}
                          >
                            {scanResult.student.fullName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{scanResult.student.fullName}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{scanResult.student.group} · {scanResult.student.studentId}</p>
                          </div>
                          {resultType === 'success' && (
                            <div className="ml-auto flex items-center gap-1 text-xs flex-shrink-0" style={{ color: '#22C55E' }}>
                              <Clock size={12} />
                              {new Date().toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Scanner;
