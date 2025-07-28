import React, { useEffect, useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import Button from '../components/Button';
//import jsPDF from 'jspdf';
import axios from 'axios';

interface PayoutData {
  id: string;
  orderNumber?: string;
  productName?: string;
  amount: number;
  date: string;
  status: string;
  commission: number;
  customerName?: string;
}

const Payouts: React.FC = () => {
  const [qrPreview, setQrPreview] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [payoutStats, setPayoutStats] = useState({
    totalEarnings: 0,
    commission: 0,
    pendingAmount: 0,
    lastPayout: 0,
  });

  // ✅ Fetch vendor's QR code on page load
  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const res = await axios.get('https://drnkly-be.onrender.com/api/qr/get-qr', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        if (res.data.qrCodeUrl) {
          setQrPreview(res.data.qrCodeUrl);
        }
      } catch (error) {
        console.error('QR fetch failed:', error);
      }
    };

    fetchQRCode();
    loadPayoutsData();
  }, []);


  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const res = await axios.get('https://drnkly-be.onrender.com/api/payouts/payouts', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`, // ✅ ADD THIS
          },
          withCredentials: true,
        });
        setPayouts(res.data.payouts);
      } catch (err) {
        console.error('Error fetching payouts:', err);
      }
    };


    fetchPayouts();
  }, []);

  // Load payouts data from localStorage and combine with existing data
  const loadPayoutsData = () => {
    // Default payouts if none exist yet
    const defaultPayouts: PayoutData[] = [
      {
        id: 'PAY001',
        amount: 67890,
        date: '2024-03-10T10:00:00Z',
        status: 'paid',
        commission: 6789,
      },
      {
        id: 'PAY002',
        amount: 45670,
        date: '2024-03-15T10:00:00Z',
        status: 'pending',
        commission: 4567,
      },
    ];

    // Get any handed over orders from localStorage
    const storedPayouts = JSON.parse(localStorage.getItem('payoutsData') || '[]');

    // Combine all payouts
    const allPayouts = [...defaultPayouts, ...storedPayouts];

    // Sort by date (newest first)
    allPayouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setPayouts(allPayouts);

    // Calculate stats
    const totalEarnings = allPayouts.reduce((sum, payout) => sum + payout.amount, 0);
    const totalCommission = allPayouts.reduce((sum, payout) => sum + payout.commission, 0);
    const pendingAmount = allPayouts
      .filter(payout => payout.status === 'pending')
      .reduce((sum, payout) => sum + payout.amount, 0);

    const lastPaidPayout = allPayouts.find(payout => payout.status === 'paid');

    setPayoutStats({
      totalEarnings,
      commission: totalCommission,
      pendingAmount,
      lastPayout: lastPaidPayout ? lastPaidPayout.amount : 0,
    });
  };

  const handleDownloadReport = () => {
    const csvRows = [
      ['Payout ID', 'Order Number', 'Product', 'Customer', 'Date', 'Amount', 'Commission', 'Status'],
      ...payouts.map(p => [
        p.id,
        p.orderNumber || 'N/A',
        p.productName || 'N/A',
        p.customerName || 'N/A',
        new Date(p.date).toLocaleDateString(),
        `₹${p.amount}`,
        `₹${p.commission}`,
        p.status,
      ]),
    ];

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'payouts-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadInvoice = (payout: PayoutData) => {
    alert('Invoice download functionality requires jsPDF which is commented out');
    /* Uncomment when jsPDF is available
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Payout Invoice', 14, 22);

    doc.setFontSize(12);
    doc.text(`Payout ID: ${payout.id}`, 14, 35);
    if (payout.orderNumber) doc.text(`Order Number: ${payout.orderNumber}`, 14, 43);
    if (payout.productName) doc.text(`Product: ${payout.productName}`, 14, 51);
    if (payout.customerName) doc.text(`Customer: ${payout.customerName}`, 14, 59);
    doc.text(`Date: ${new Date(payout.date).toLocaleDateString()}`, 14, 67);
    doc.text(`Amount: ₹${payout.amount}`, 14, 75);
    doc.text(`Commission: ₹${payout.commission}`, 14, 83);
    doc.text(`Status: ${payout.status}`, 14, 91);

    doc.setFontSize(10);
    doc.text('Thank you for using our platform!', 14, 100);
    doc.save(`Invoice_${payout.id}.pdf`);
    */
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('qrCode', file);

    try {
      const res = await axios.post('http://localhost:5001/api/qr/upload-qr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      setQrPreview(res.data.url);
      setUploadStatus('QR uploaded successfully');
    } catch (error) {
      console.error(error);
      setUploadStatus('QR upload failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payout Management</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Total Earnings</p>
          <p className="text-2xl font-semibold mt-1">₹{payoutStats.totalEarnings}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Commission Paid</p>
          <p className="text-2xl font-semibold mt-1">₹{payoutStats.commission}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Pending Amount</p>
          <p className="text-2xl font-semibold mt-1">₹{payoutStats.pendingAmount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-600">Last Payout</p>
          <p className="text-2xl font-semibold mt-1">₹{payoutStats.lastPayout}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <select className="w-full px-4 py-2 border rounded-lg">
            <option>All Categories</option>
            <option>Whiskey</option>
            <option>Vodka</option>
            <option>Wine</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <Button
          variant="secondary"
          icon={<Download className="w-5 h-5" />}
          onClick={handleDownloadReport}
        >
          Download Report
        </Button>
      </div>

      {/* QR Upload Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Upload QR Code</h2>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100"
          onChange={handleQRUpload}
        />
        {qrPreview && (
          <img
            src={qrPreview}
            alt="QR Code Preview"
            className="w-32 h-auto mt-2 rounded border"
          />
        )}
        {uploadStatus && <p className="text-sm text-green-600">{uploadStatus}</p>}
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payout ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{payout.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payout.orderNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payout.productName || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payout.customerName || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(payout.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{payout.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{payout.commission}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${payout.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="secondary"
                      icon={<Download className="w-4 h-4" />}
                      className="px-2 py-1"
                      onClick={() => handleDownloadInvoice(payout)}
                    >
                      Invoice
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payouts;
