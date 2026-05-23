import { useState } from 'react';
import { CalendarOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Flex,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text } = Typography;

const getStepStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'confirmed':
      return 'processing';
    case 'in_progress':
      return 'purple';
    case 'finished':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

function ProductionOrderScheduleDrawer({
  open,
  onClose,
  steps = [],
  productionStartedAt,
  productionOrderId,
  onSaved,
}) {
  const [scheduleValues, setScheduleValues] = useState({});
  const [saving, setSaving] = useState(false);

  const initializeScheduleValues = () => {
    const initialValues = {};

    steps.forEach((step) => {
      initialValues[step.production_order_step] = step.expected_finished_at
        ? dayjs(step.expected_finished_at)
        : null;
    });

    setScheduleValues(initialValues);
  };

  const handleSave = async () => {
    if (!productionOrderId) return;

    try {
      setSaving(true);

      const payloadSteps = steps
        .filter((step) => step.status === 'confirmed')
        .filter((step) => scheduleValues[step.production_order_step])
        .map((step) => ({
          production_order_step: step.production_order_step,
          expected_finished_at: scheduleValues[step.production_order_step]
            .hour(23)
            .minute(59)
            .second(0)
            .millisecond(0)
            .format('YYYY-MM-DDTHH:mm:ssZ'),
        }));

      const response = await api.post(
        `production-orders/${productionOrderId}/update-steps-schedule/`,
        {
          steps: payloadSteps,
        },
      );

      message.success('Графік виробництва збережено.');

      onClose();

      if (onSaved) {
        await onSaved(response.data?.detail);
      }
    } catch (err) {
      console.error('Failed to update production order schedule:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'steps',
        'expected_finished_at',
      ]);

      message.error(backendMessage || 'Не вдалося зберегти графік.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Налаштування графіку виробництва"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
      afterOpenChange={(isOpen) => {
        if (isOpen) {
          initializeScheduleValues();
        }
      }}
    >
      <Flex vertical gap={16}>
        {steps.map((step, index) => {
          const previousStep = steps[index - 1];
          const previousStepDate = previousStep
            ? scheduleValues[previousStep.production_order_step]
            : null;
          const canEditDate =
            !['draft', 'cancelled'].includes(step.status) &&
            (index === 0 || Boolean(previousStepDate));

          const disabledDate = (currentDate) => {
            if (!currentDate) return false;

            if (index === 0 && productionStartedAt) {
              return currentDate.isBefore(dayjs(productionStartedAt), 'day');
            }

            if (previousStepDate) {
              return !currentDate.isAfter(previousStepDate, 'day');
            }

            return false;
          };

          return (
            <Card
              key={step.production_order_step}
              title={
                <Flex justify="space-between" align="center" gap={12}>
                  <span>
                    {step.source_product_step || '—'}. {step.name || '—'}
                  </span>

                  <Tag
                    color={getStepStatusTagColor(step.status)}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {step.status_display || step.status || '—'}
                  </Tag>
                </Flex>
              }
            >
              {['draft', 'cancelled'].includes(step.status) ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Налаштування дати закінчення етапу можливе лише для підтверджених етапів!"
                />
              ) : (
                <Descriptions
                  bordered
                  size="small"
                  column={1}
                  items={[
                    {
                      key: 'expected_finished_at',
                      label: 'Дата закінчення етапу',
                      children: canEditDate ? (
                        <DatePicker
                          inputReadOnly
                          value={
                            scheduleValues[step.production_order_step] || null
                          }
                          disabledDate={disabledDate}
                          suffixIcon={
                            <CalendarOutlined style={{ color: '#1677ff' }} />
                          }
                          onChange={(value) => {
                            setScheduleValues((prev) => ({
                              ...prev,
                              [step.production_order_step]: value,
                            }));
                          }}
                        />
                      ) : (
                        <Tooltip title="Спочатку потрібно вказати дату закінчення попереднього етапу.">
                          <CalendarOutlined
                            style={{
                              color: '#bfbfbf',
                              cursor: 'not-allowed',
                            }}
                          />
                        </Tooltip>
                      ),
                    },
                  ]}
                />
              )}
            </Card>
          );
        })}

        <Flex justify="space-between" gap={8}>
          <Button onClick={onClose} disabled={saving}>
            Закрити
          </Button>

          <Button type="primary" loading={saving} onClick={handleSave}>
            Зберегти зміни
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionOrderScheduleDrawer;
