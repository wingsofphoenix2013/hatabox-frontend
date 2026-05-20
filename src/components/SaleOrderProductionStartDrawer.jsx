import { useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  Input,
  Switch,
  Typography,
  message,
} from 'antd';

import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text } = Typography;

function SaleOrderProductionStartDrawer({
  open,
  onClose,
  productionOrderId,
  onStarted,
}) {
  const [serialNumber, setSerialNumber] = useState('');
  const [expectedReadyAt, setExpectedReadyAt] = useState(null);
  const [comment, setComment] = useState('');
  const [starting, setStarting] = useState(false);

  const resetState = () => {
    setSerialNumber('');
    setExpectedReadyAt(null);
    setComment('');
    setStarting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleStartProduction = async () => {
    if (!productionOrderId) return;

    try {
      setStarting(true);

      const response = await api.post(
        `production-orders/${productionOrderId}/start/`,
        {
          serial_number: serialNumber,
          use_work_tracking: false,
          use_hr_tracking: false,
          expected_ready_at: expectedReadyAt?.toISOString(),
          comment: comment || '',
        },
      );

      message.success('Виробництво запущено.');

      resetState();
      onClose();

      if (onStarted) {
        await onStarted(response.data);
      }
    } catch (err) {
      console.error('Failed to start production order:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'serial_number',
        'expected_ready_at',
        'comment',
      ]);

      message.error(backendMessage || 'Не вдалося запустити виробництво.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <Drawer
      title="Запуск виробництва"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="Оберіть серійний номер">
          <Input
            placeholder="Введіть серійний номер"
            value={serialNumber}
            disabled={starting}
            maxLength={100}
            onChange={(event) => setSerialNumber(event.target.value)}
          />
        </Card>

        <Card title="Оберіть тип обліку">
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" gap={12}>
              <Text>Облік виробничих процесів</Text>
              <Switch
                checked={false}
                disabled
                checkedChildren="Так"
                unCheckedChildren="Ні"
              />
            </Flex>

            <Flex justify="space-between" align="center" gap={12}>
              <Text>Облік співробітників</Text>
              <Switch
                checked={false}
                disabled
                checkedChildren="Так"
                unCheckedChildren="Ні"
              />
            </Flex>

            <Flex vertical gap={8}>
              <Text>Очікувана дата закінчення виробництва</Text>
              <DatePicker
                showTime
                style={{ width: '100%' }}
                value={expectedReadyAt}
                disabled={starting}
                onChange={setExpectedReadyAt}
              />
            </Flex>
          </Flex>
        </Card>

        <Card title="Додайте коментар">
          <Input.TextArea
            rows={4}
            placeholder="Коментар до запуску"
            value={comment}
            disabled={starting}
            onChange={(event) => setComment(event.target.value)}
          />
        </Card>

        <Flex justify="space-between" gap={8}>
          <Button onClick={handleClose} disabled={starting}>
            Закрити
          </Button>

          <Button
            type="primary"
            loading={starting}
            disabled={!serialNumber.trim() || !expectedReadyAt}
            onClick={handleStartProduction}
          >
            Старт виробництва
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default SaleOrderProductionStartDrawer;
