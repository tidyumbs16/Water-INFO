'use client'; // คำสั่งนี้ระบุว่าเป็น Client Component ที่ทำงานบนฝั่ง Browser

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // นำเข้า useRouter สำหรับการ Redirect
import { Loader2, Send, CheckCircle, AlertCircle, UploadCloud } from 'lucide-react';

// กำหนดประเภทข้อมูลสำหรับฟอร์ม (TypeScript Interface)
interface IssueFormData {
  phone: string;
  issueType: string;
  subject: string;
  details: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  attachment: File | null;
}

const ReportIssuePage: React.FC = () => {
  const router = useRouter(); // เรียกใช้ useRouter hook

  // States สำหรับข้อมูลฟอร์ม
  const [formData, setFormData] = useState<IssueFormData>({
    phone: '',
    issueType: '',
    subject: '',
    details: '',
    priority: 'medium', // Default to medium priority
    attachment: null,
  });

  // States สำหรับการจัดการ UI (Loading, Error, Success)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States สำหรับการตรวจสอบความถูกต้องของฟอร์ม (Form Validation)
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Handler สำหรับการเปลี่ยนแปลงค่าใน Input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the specific field when it changes
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handler สำหรับการเลือกไฟล์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

      if (file.size > MAX_FILE_SIZE) {
        setErrors(prev => ({ ...prev, attachment: 'ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)' }));
        setFormData(prev => ({ ...prev, attachment: null }));
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setErrors(prev => ({ ...prev, attachment: 'ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ PNG, JPG, PDF' }));
        setFormData(prev => ({ ...prev, attachment: null }));
        return;
      }
      setFormData(prev => ({ ...prev, attachment: file }));
      if (errors.attachment) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.attachment;
          return newErrors;
        });
      }
    } else {
      setFormData(prev => ({ ...prev, attachment: null }));
    }
  };

  // Function สำหรับตรวจสอบความถูกต้องของฟอร์มทั้งหมด
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.issueType) newErrors.issueType = 'โปรดเลือกประเภทปัญหา';
    if (!formData.subject.trim()) newErrors.subject = 'โปรดระบุหัวข้อปัญหา';
    if (!formData.details.trim()) newErrors.details = 'โปรดระบุรายละเอียดปัญหา';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler สำหรับการ Submit ฟอร์ม
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      setError('โปรดแก้ไขข้อผิดพลาดในฟอร์ม');
      return;
    }

    setIsLoading(true);

    const data = new FormData();
    data.append('phone', formData.phone);
    data.append('issueType', formData.issueType);
    data.append('subject', formData.subject);
    data.append('details', formData.details);
    data.append('priority', formData.priority);
    if (formData.attachment) {
      data.append('attachment', formData.attachment);
    }

    try {
      const response = await fetch('/api/report-contact', {
        method: 'POST',
        body: data, // FormData จะถูกตั้งค่า Content-Type อัตโนมัติเป็น multipart/form-data
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(result.message);
        // Reset form after successful submission
        setFormData({
          phone: '',
          issueType: '',
          subject: '',
          details: '',
          priority: 'medium',
          attachment: null,
        });
        setErrors({}); // Clear any previous errors

        // --- Logic การ Redirect ไปหน้า Alert Management สำหรับ Admin ---
        const authToken = localStorage.getItem('authToken'); // ตรวจสอบว่ามี Token ของ Admin หรือไม่
        if (authToken) {
            // ถ้ามี Token (ถือว่าเป็น Admin ที่ล็อกอินอยู่) ให้ Redirect ไปหน้า Alert Management
            setTimeout(() => {
                // *** สำคัญ: เปลี่ยน Path นี้ให้ตรงกับ Path จริงของ AlertManagementPage ของคุณ ***
                router.push('/admin/alerts'); // ตัวอย่าง Path: /admin/alerts
            }, 2000); // หน่วงเวลา 2 วินาที เพื่อให้ผู้ใช้เห็นข้อความ Success ก่อน
        } else {
            // ถ้าไม่มี Token (ผู้ใช้ทั่วไป) ให้แสดงข้อความ Success ค้างไว้ชั่วคราวแล้วหายไป
            setTimeout(() => {
                setSuccessMessage(null); // ลบข้อความ Success หลังผ่านไป 3 วินาที
            }, 3000);
        }

      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการส่งรายงาน');
      }
    } catch (err) {
      console.error('Network error or unexpected error:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้. โปรดลองใหม่อีกครั้ง.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4">
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 w-full max-w-2xl animate-fade-in">
        <h1 className="text-4xl font-extrabold text-white text-center mb-6 flex items-center justify-center">
          <Send className="w-9 h-9 mr-3 text-cyan-400" /> แจ้งปัญหา
        </h1>
        <p className="text-slate-400 text-center mb-8">
          โปรดกรอกรายละเอียดของปัญหาที่ท่านพบ เพื่อให้ทีมงานของเราดำเนินการแก้ไขอย่างรวดเร็ว
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-300 rounded-xl p-4 mb-6 flex items-center space-x-3">
            <AlertCircle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 rounded-xl p-4 mb-6 flex items-center space-x-3 animate-fade-in">
            <CheckCircle className="w-6 h-6" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="issueType" className="block text-slate-300 text-sm font-medium mb-2 required-field">
              ประเภทปัญหา <span className="text-red-500">*</span>
            </label>
            <select
              id="issueType"
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-slate-700/50 border ${errors.issueType ? 'border-red-500' : 'border-slate-600/50'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50`}
              disabled={isLoading}
              required
            >
              <option value="">-- เลือกประเภทปัญหา --</option>
              <option value="data_error">ข้อมูลผิดพลาด</option>
              <option value="system_bug">ระบบขัดข้อง/Bug</option>
              <option value="feature_request">ข้อเสนอแนะ/ขอคุณสมบัติใหม่</option>
              <option value="performance_issue">ประสิทธิภาพระบบช้า</option>
              <option value="security_concern">ข้อกังวลด้านความปลอดภัย</option>
              <option value="other">อื่นๆ</option>
            </select>
            {errors.issueType && <p className="mt-2 text-sm text-red-400">{errors.issueType}</p>}
          </div>

          <div>
            <label htmlFor="subject" className="block text-slate-300 text-sm font-medium mb-2 required-field">
              หัวข้อปัญหา <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-slate-700/50 border ${errors.subject ? 'border-red-500' : 'border-slate-600/50'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50`}
              placeholder="สรุปปัญหาโดยย่อ"
              disabled={isLoading}
              required
            />
            {errors.subject && <p className="mt-2 text-sm text-red-400">{errors.subject}</p>}
          </div>

          <div>
            <label htmlFor="details" className="block text-slate-300 text-sm font-medium mb-2 required-field">
              รายละเอียดปัญหา <span className="text-red-500">*</span>
            </label>
            <textarea
              id="details"
              name="details"
              rows={5}
              value={formData.details}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-slate-700/50 border ${errors.details ? 'border-red-500' : 'border-slate-600/50'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-y`}
              placeholder="โปรดอธิบายรายละเอียดปัญหาให้มากที่สุด"
              disabled={isLoading}
              required
            ></textarea>
            {errors.details && <p className="mt-2 text-sm text-red-400">{errors.details}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-slate-300 text-sm font-medium mb-2">
              เบอร์โทรศัพท์ (ถ้ามี)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              placeholder="08X-XXXXXXX"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-slate-300 text-sm font-medium mb-2">
              ระดับความสำคัญ
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              disabled={isLoading}
            >
              <option value="low">ต่ำ</option>
              <option value="medium">ปานกลาง</option>
              <option value="high">สูง</option>
              <option value="critical">วิกฤต</option>
            </select>
          </div>

          <div>
            <label htmlFor="attachment" className="block text-slate-300 text-sm font-medium mb-2">
              แนบรูปภาพ/เอกสาร (PNG, JPG, PDF - สูงสุด 5MB)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                id="attachment"
                name="attachment"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
                accept=".png,.jpg,.jpeg,.pdf"
              />
              <label
                htmlFor="attachment"
                className="flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer transition-colors duration-200 shadow-md"
              >
                <UploadCloud className="w-5 h-5 mr-2" />
                <span>เลือกไฟล์</span>
              </label>
              <span className="text-slate-400 text-sm">
                {formData.attachment ? formData.attachment.name : 'ยังไม่มีไฟล์ที่เลือก'}
              </span>
            </div>
            {errors.attachment && <p className="mt-2 text-sm text-red-400">{errors.attachment}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-semibold py-3 rounded-xl hover:from-cyan-700 hover:to-blue-800 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
            <span>{isLoading ? 'กำลังส่ง...' : 'ส่งรายงานปัญหา'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportIssuePage;