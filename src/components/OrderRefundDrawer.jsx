import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  Input,
  InputNumber,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { extractFileFromUploadEvent } from '../utils/fileHelpers';

const { Text } = Typography;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

function OrderRefundDrawer({ open, onClose, order, onSaved }) {
  const [refundNo, setRefundNo] = useState('');
  const [refundAmount, setRefundAmount] = useState(null);
  const [refundDate, setRefundDate] = useState(null);
  const [comment, setComment] = useState('');
  const [refundFile, setRefundFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const suggestedRefundNo = useMemo(() => {
    const existingRefunds = Array.isArray(order?.refund_documents)
      ? order.refund_documents
      : [];

    return `REF-${order?.order_no || order?.id || '—'}-${
      existingRefunds.length + 1
    }`;
  }, [order]);

  const canSubmit =
    Boolean(refundNo) &&
    refundAmount !== null &&
    refundAmount !== undefined &&
    Number(refundAmount) > 0 &&
    Boolean(refundDate);

  const resetForm = () => {
    setRefundNo('');
    setRefundAmount(null);
    setRefundDate(null);
    setComment('');
    setRefundFile(null);
    setSaving(false);
  };

  const handleCloseDrawer = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    setRefundNo(suggestedRefundNo);
    setRefundAmount(null);
    setRefundDate(dayjs());
    setComment('');
    setRefundFile(null);
  }, [open, suggestedRefundNo]);

  const handleFileChange = ({ fileList }) => {
    const fileObj = extractFileFromUploadEvent(fileList);

    if (!fileObj) {
      setRefundFile(null);
      return;
    }

    if (fileObj.type !== 'application/pdf') {
      message.error('Дозволено завантажувати лише PDF-файл.');
      setRefundFile(null);
      return;
    }

    setRefundFile(fileObj);
  };

  const handleSave = async () => {
    if (!canSubmit) {
      message.error('Заповніть обов’язкові поля.');
      return;
    }

    try {
      setSaving(true);

      const payload = new FormData();
      payload.append('refund_no', refundNo);
      payload.append('order', String(order.id));
      payload.append('refund_amount', String(refundAmount));
      payload.append('refund_date', refundDate.format('YYYY-MM-DD'));
      payload.append('comment', comment || '');

      if (refundFile) {
        payload.append('file', refundFile);
      }

      await api.post('refund-documents/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Документ повернення коштів створено.');

      if (onSaved) {
        await onSaved();
      }

      handleCloseDrawer();
    } catch (err) {
      console.error('Failed to create refund document:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'refund_no',
        'order',
        'refund_amount',
        'refund_date',
        'comment',
        'file',
      ]);

      message.error(
        backendMessage || 'Не вдалося створити документ повернення коштів.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Повернення коштів"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="Оформлення повернення коштів">
          <Flex vertical gap={14}>
            <div>
              <Text style={compactLabelStyle}>Номер документу</Text>

              <Input
                value={refundNo}
                onChange={(e) => setRefundNo(e.target.value)}
              />
            </div>

            <div>
              <Text style={compactLabelStyle}>Сума повернення</Text>

              <InputNumber
                min={0.01}
                step={0.01}
                controls={false}
                value={refundAmount}
                onChange={setRefundAmount}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <Text style={compactLabelStyle}>Дата повернення</Text>

              <DatePicker
                value={refundDate}
                format="DD-MM-YYYY"
                onChange={setRefundDate}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <Text style={compactLabelStyle}>PDF-файл платіжки</Text>

              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept=".pdf"
                onChange={handleFileChange}
              >
                <Button icon={<UploadOutlined />}>Обрати PDF</Button>
              </Upload>
            </div>

            <div>
              <Text style={compactLabelStyle}>Коментар</Text>

              <Input.TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </Flex>
        </Card>

        <Flex justify="space-between" gap={8}>
          <Button onClick={handleCloseDrawer}>Закрити</Button>

          <Tooltip
            title={canSubmit ? '' : 'Заповніть усю обов’язкову інформацію.'}
          >
            <Button
              type="primary"
              disabled={!canSubmit}
              loading={saving}
              onClick={handleSave}
            >
              Зберегти
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default OrderRefundDrawer;
