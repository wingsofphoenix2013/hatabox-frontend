import { useState } from 'react';
import { CheckCircleFilled, WarningFilled } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Tooltip,
  Flex,
  Popconfirm,
  Typography,
  message,
} from 'antd';

import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateDisplay } from '../utils/orderFormatters';

const { Text } = Typography;

function ProductionOrderStepFinishedDrawer({
  open,
  onClose,
  step,
  serialNumber,
  isLastStep,
  onFinished,
}) {
  const [finishing, setFinishing] = useState(false);
  const now = new Date();
  return (
    <Drawer
      title="Завершення етапу"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card
          title={`Завершення етапу: ${step?.source_product_step || '—'}. ${
            step?.name || '—'
          }`}
        >
          <Flex vertical gap={16}>
            <Descriptions
              bordered
              size="small"
              column={1}
              items={[
                {
                  key: 'started_at',
                  label: 'Етап розпочато',
                  children: step?.started_at
                    ? formatDateDisplay(step.started_at)
                    : '—',
                },
                {
                  key: 'expected_finished_at',
                  label: 'Запланована дата закінчення',
                  children: step?.expected_finished_at
                    ? formatDateDisplay(step.expected_finished_at)
                    : '—',
                },
                {
                  key: 'finished_at',
                  label: 'Фактична дата закінчення',
                  children: formatDateDisplay(now),
                },
                {
                  key: 'plan_execution',
                  label: 'Виконання плану',
                  children: step?.current_is_overdue ? (
                    <Tooltip
                      title={`Затримка: ${Math.abs(
                        Number(step.current_days_left) || 0,
                      )} днів`}
                    >
                      <Flex align="center" gap={6}>
                        <WarningFilled style={{ color: '#ff4d4f' }} />
                        <Text strong>Затримка</Text>
                      </Flex>
                    </Tooltip>
                  ) : (
                    <Flex align="center" gap={6}>
                      <CheckCircleFilled style={{ color: '#52c41a' }} />
                      <Text strong>Без запізнення</Text>
                    </Flex>
                  ),
                },
              ]}
            />

            <Alert
              type="success"
              showIcon
              message={
                <Flex vertical gap={4}>
                  <Text>Етап буде завершено з поточною датою виконання</Text>
                  <Text>Всі компоненти етапу будуть списані</Text>
                  {isLastStep && (
                    <Text>
                      Виробництво замовлення №{serialNumber || '—'} буде
                      позначене виконаним
                    </Text>
                  )}
                </Flex>
              }
            />

            {step?.current_is_overdue && (
              <Alert
                type="warning"
                showIcon
                message="З причини завершення етапу з затримкою подальшій графік виконання робіт потрібно сформувати наново!"
              />
            )}
          </Flex>
        </Card>

        <Flex justify="space-between" gap={8}>
          <Button onClick={onClose} disabled={finishing}>
            Закрити
          </Button>

          <Popconfirm
            title="Завершити етап?"
            description="Цю дію неможливо скасувати."
            okText="Завершити"
            cancelText="Скасувати"
            onConfirm={async () => {
              if (!step?.production_order_step) return;

              try {
                setFinishing(true);

                await api.post(
                  `production-order-steps/${step.production_order_step}/finish/`,
                  {},
                );

                message.success('Етап завершено.');

                onClose();

                if (onFinished) {
                  await onFinished();
                }
              } catch (err) {
                console.error('Failed to finish production step:', err);

                const backendMessage = getApiErrorMessage(err?.response?.data);

                message.error(backendMessage || 'Не вдалося завершити етап.');
              } finally {
                setFinishing(false);
              }
            }}
          >
            <Button type="primary" loading={finishing}>
              Завершити етап
            </Button>
          </Popconfirm>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionOrderStepFinishedDrawer;
