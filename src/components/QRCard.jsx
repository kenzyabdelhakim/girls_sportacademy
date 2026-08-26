import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Download, Printer, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import logoFull from '../assets/logo-strip.png';

const QRCard = ({ student }) => {
  const canvasRef = useRef(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => { generateQRCode(); }, [student]);

  const generateQRCode = async () => {
    if (!canvasRef.current || !student) return;
    try {
      await QRCode.toCanvas(canvasRef.current, student.studentId, {
        width: 220,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      });
      setQrGenerated(true);
    } catch {
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = () => {
    if (!canvasRef.current) return;
    try {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `${student.studentId}_${student.fullName.replace(/\s+/g, '_')}_QR.png`;
      a.href = url; a.click();
      toast.success('QR code downloaded');
    } catch { toast.error('Download failed'); }
  };

  const printQRCode = () => {
    const pw = window.open('', '_blank');
    if (!pw) { toast.error('Allow popups to print'); return; }
    const url = canvasRef.current.toDataURL('image/png');
    const logoUrl = window.location.origin + logoFull;
    pw.document.write(`<!DOCTYPE html><html><head><title>QR - ${student.fullName}</title>
      <style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff;}
      .card{text-align:center;border:2px solid #FBCFE8;padding:32px;border-radius:24px;max-width:400px;}
      .logo{height:64px;width:auto;margin-bottom:16px;}
      .name{font-size:22px;font-weight:800;color:#0f0f1a;margin-bottom:4px;}
      .id{font-size:13px;color:#6b7280;margin-bottom:4px;}img.qr{margin:20px 0;}
      @media print{body{padding:0;}}
      </style></head><body><div class="card">
      <img class="logo" src="${logoUrl}" alt="Rovy Swimming Academy" />
      <div class="name">${student.fullName}</div>
      <div class="id">ID: ${student.studentId} · ${student.group}</div>
      <img class="qr" src="${url}" alt="QR" />
      <div class="id">Rovy Swimming Academy · Attendance QR Code</div>
      </div></body></html>`);
    pw.document.close();
    setTimeout(() => { pw.print(); pw.close(); }, 250);
    toast.success('Opening print dialog…');
  };

  return (
    <div className="space-y-4">
      {/* Student info */}
      <div
        className="text-center p-4 rounded-xl"
        style={{ background: 'rgba(249, 168, 212,0.1)', border: '1px solid rgba(249, 168, 212,0.2)' }}
      >
        <h3 className="text-lg font-black text-white mb-0.5">{student.fullName}</h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {student.group} · ID: {student.studentId}
        </p>
      </div>

      {/* QR Code */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="flex justify-center p-5 rounded-xl"
        style={{ background: '#ffffff', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      >
        <canvas ref={canvasRef} />
      </motion.div>

      {/* Info */}
      <div className="p-3 rounded-xl" style={{ background: 'rgba(236, 72, 153,0.06)', border: '1px solid rgba(236, 72, 153,0.12)' }}>
        <p className="text-xs" style={{ color: 'rgba(236, 72, 153,0.8)' }}>
          Scan this QR code using the Scanner page to mark attendance.
        </p>
      </div>

      {/* Actions */}
      {qrGenerated && (
        <div className="flex gap-2">
          <motion.button
            onClick={downloadQRCode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 btn-primary"
          >
            <Download size={15} /> Download
          </motion.button>
          <motion.button
            onClick={printQRCode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 btn-secondary"
          >
            <Printer size={15} /> Print
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default QRCard;
