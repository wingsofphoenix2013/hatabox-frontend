import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
  Segmented,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text } = Typography;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

const phoneTypeOptions = [
  { value: 'voice', label: 'Voice' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'signal', label: 'Signal' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'viber', label: 'Viber' },
  { value: 'other', label: 'Інше' },
];

const birthDayOptions = Array.from({ length: 31 }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));

const birthMonthOptions = [
  { value: 1, label: 'Січень' },
  { value: 2, label: 'Лютий' },
  { value: 3, label: 'Березень' },
  { value: 4, label: 'Квітень' },
  { value: 5, label: 'Травень' },
  { value: 6, label: 'Червень' },
  { value: 7, label: 'Липень' },
  { value: 8, label: 'Серпень' },
  { value: 9, label: 'Вересень' },
  { value: 10, label: 'Жовтень' },
  { value: 11, label: 'Листопад' },
  { value: 12, label: 'Грудень' },
];

const landRankOptions = [
  { value: 'soldier', label: 'Солдат' },
  { value: 'senior_soldier', label: 'Старший солдат' },
  { value: 'junior_sergeant', label: 'Молодший сержант' },
  { value: 'sergeant', label: 'Сержант' },
  { value: 'senior_sergeant', label: 'Старший сержант' },
  { value: 'chief_sergeant', label: 'Головний сержант' },
  { value: 'staff_sergeant', label: 'Штаб-сержант' },
  { value: 'master_sergeant', label: 'Майстер-сержант' },
  { value: 'senior_master_sergeant', label: 'Старший майстер-сержант' },
  { value: 'chief_master_sergeant', label: 'Головний майстер-сержант' },
  { value: 'junior_lieutenant', label: 'Молодший лейтенант' },
  { value: 'lieutenant', label: 'Лейтенант' },
  { value: 'senior_lieutenant', label: 'Старший лейтенант' },
  { value: 'captain', label: 'Капітан' },
  { value: 'major', label: 'Майор' },
  { value: 'lieutenant_colonel', label: 'Підполковник' },
  { value: 'colonel', label: 'Полковник' },
  { value: 'brigadier_general', label: 'Бригадний генерал' },
  { value: 'major_general', label: 'Генерал-майор' },
  { value: 'lieutenant_general', label: 'Генерал-лейтенант' },
  { value: 'general', label: 'Генерал' },
];

const navyRankOptions = [
  { value: 'matros', label: 'Матрос' },
  { value: 'senior_matros', label: 'Старший матрос' },
  { value: 'starshyna_2', label: 'Старшина 2 статті' },
  { value: 'starshyna_1', label: 'Старшина 1 статті' },
  { value: 'chief_starshyna', label: 'Головний старшина' },
  { value: 'chief_ship_starshyna', label: 'Головний корабельний старшина' },
  { value: 'staff_starshyna', label: 'Штаб-старшина' },
  { value: 'master_starshyna', label: 'Майстер-старшина' },
  { value: 'senior_master_starshyna', label: 'Старший майстер-старшина' },
  { value: 'chief_master_starshyna', label: 'Головний майстер-старшина' },
  { value: 'junior_lieutenant', label: 'Молодший лейтенант' },
  { value: 'lieutenant', label: 'Лейтенант' },
  { value: 'senior_lieutenant', label: 'Старший лейтенант' },
  { value: 'captain_lieutenant', label: 'Капітан-лейтенант' },
  { value: 'captain_3_rank', label: 'Капітан 3 рангу' },
  { value: 'captain_2_rank', label: 'Капітан 2 рангу' },
  { value: 'captain_1_rank', label: 'Капітан 1 рангу' },
  { value: 'commodore', label: 'Коммодор' },
  { value: 'rear_admiral', label: 'Контр-адмірал' },
  { value: 'vice_admiral', label: 'Віце-адмірал' },
  { value: 'admiral', label: 'Адмірал' },
];

function ContactCreateDrawer({ open, onClose, onCreated }) {
  const [form] = Form.useForm();
  const [assignmentForm] = Form.useForm();

  const [createdPerson, setCreatedPerson] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [rankForceType, setRankForceType] = useState('land');

  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [positionsLoading, setPositionsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      assignmentForm.resetFields();
      setCreatedPerson(null);
      setSaving(false);
      setSavingAssignment(false);
      setRankForceType('land');
      setOrganizationOptions([]);
      setPositionOptions([]);
    }
  }, [open, form, assignmentForm]);

  const handleCloseDrawer = () => {
    form.resetFields();
    assignmentForm.resetFields();
    setCreatedPerson(null);
    setRankForceType('land');
    setOrganizationOptions([]);
    setPositionOptions([]);
    onClose();
  };

  const handleCreatePerson = async (values) => {
    try {
      setSaving(true);

      const payload = {
        last_name: values.last_name,
        first_name: values.first_name,
        middle_name: values.middle_name || '',
        birth_day: values.birth_day || null,
        birth_month: values.birth_month || null,
        phone_1: values.phone_1 || '',
        phone_1_type: values.phone_1_type || '',
        phone_2: values.phone_2 || '',
        phone_2_type: values.phone_2_type || '',
        comment: values.comment || '',
        is_active: true,
      };

      if (values.rank) {
        payload.rank_force_type = rankForceType;
        payload.rank = values.rank;
      }

      const response = await api.post('people/', payload);

      setCreatedPerson(response.data);
      message.success('Контакт створено.');
    } catch (err) {
      console.error('Failed to create person:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'last_name',
        'first_name',
        'middle_name',
        'birth_day',
        'birth_month',
        'rank_force_type',
        'rank',
        'phone_1',
        'phone_1_type',
        'phone_2',
        'phone_2_type',
        'comment',
      ]);

      message.error(backendMessage || 'Не вдалося створити контакт.');
    } finally {
      setSaving(false);
    }
  };

  const loadOrganizationOptions = async (search = '') => {
    try {
      setOrganizationsLoading(true);

      const params = new URLSearchParams();

      if (search) {
        params.append('search', search);
      }

      const response = await api.get(`organizations/?${params.toString()}`);
      const results = Array.isArray(response.data) ? response.data : [];

      setOrganizationOptions(
        results.map((item) => ({
          value: item.id,
          label: item.name || '—',
        })),
      );
    } catch (err) {
      console.error('Failed to load organization options:', err);
      setOrganizationOptions([]);
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const loadPositionOptions = async (search = '') => {
    try {
      setPositionsLoading(true);

      const params = new URLSearchParams();
      params.append('is_active', 'true');

      if (search) {
        params.append('search', search);
      }

      const response = await api.get(
        `organization-positions/?${params.toString()}`,
      );

      const results = Array.isArray(response.data.results)
        ? response.data.results
        : Array.isArray(response.data)
          ? response.data
          : [];

      setPositionOptions(
        results.map((item) => ({
          value: item.id,
          label: item.name || '—',
        })),
      );
    } catch (err) {
      console.error('Failed to load position options:', err);
      setPositionOptions([]);
    } finally {
      setPositionsLoading(false);
    }
  };

  const handleSaveAssignment = async (values) => {
    if (!createdPerson) return;

    try {
      setSavingAssignment(true);

      await api.post('organization-person-assignments/', {
        person: createdPerson.id,
        organization: values.organization,
        position: values.position,
        is_current: true,
      });

      message.success('Місце служби збережено.');
      handleCloseDrawer();

      if (onCreated) {
        await onCreated();
      }
    } catch (err) {
      console.error('Failed to create assignment:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'person',
        'organization',
        'position',
        'is_current',
      ]);

      message.error(backendMessage || 'Не вдалося зберегти місце служби.');
    } finally {
      setSavingAssignment(false);
    }
  };

  return (
    <Drawer
      title="Створення контакту"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
    >
      <Form form={form} layout="vertical" onFinish={handleCreatePerson}>
        <Flex vertical gap={16}>
          <Card title="1. Створити контакт">
            <Flex vertical gap={14}>
              <Flex gap={12}>
                <div style={{ flex: 1 }}>
                  <Text style={compactLabelStyle}>Ім’я</Text>
                  <Form.Item name="first_name" style={{ marginBottom: 0 }}>
                    <Input disabled={!!createdPerson} />
                  </Form.Item>
                </div>

                <div style={{ flex: 1 }}>
                  <Text style={compactLabelStyle}>По батькові</Text>
                  <Form.Item name="middle_name" style={{ marginBottom: 0 }}>
                    <Input disabled={!!createdPerson} />
                  </Form.Item>
                </div>
              </Flex>

              <div>
                <Text style={compactLabelStyle}>Прізвище</Text>
                <Form.Item name="last_name" style={{ marginBottom: 0 }}>
                  <Input disabled={!!createdPerson} />
                </Form.Item>
              </div>

              <Flex gap={12}>
                <div style={{ flex: 1 }}>
                  <Text style={compactLabelStyle}>День народження</Text>
                  <Form.Item name="birth_day" style={{ marginBottom: 0 }}>
                    <Select
                      placeholder="День"
                      options={birthDayOptions}
                      disabled={!!createdPerson}
                      allowClear
                    />
                  </Form.Item>
                </div>

                <div style={{ flex: 1 }}>
                  <Text style={compactLabelStyle}>Місяць народження</Text>
                  <Form.Item name="birth_month" style={{ marginBottom: 0 }}>
                    <Select
                      placeholder="Місяць"
                      options={birthMonthOptions}
                      disabled={!!createdPerson}
                      allowClear
                    />
                  </Form.Item>
                </div>
              </Flex>

              <div>
                <Text style={compactLabelStyle}>Тип звання</Text>
                <Segmented
                  value={rankForceType}
                  disabled={!!createdPerson}
                  onChange={(value) => {
                    setRankForceType(value);
                    form.setFieldValue('rank', undefined);
                  }}
                  options={[
                    { value: 'land', label: 'Армійське' },
                    { value: 'navy', label: 'Корабельне' },
                  ]}
                />
              </div>

              <div>
                <Text style={compactLabelStyle}>Звання</Text>
                <Form.Item name="rank" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="Оберіть звання"
                    options={
                      rankForceType === 'land'
                        ? landRankOptions
                        : navyRankOptions
                    }
                    disabled={!!createdPerson}
                    allowClear
                  />
                </Form.Item>
              </div>

              <Flex gap={12}>
                <div style={{ flex: 1 }}>
                  <Text style={compactLabelStyle}>Телефон 1</Text>
                  <Form.Item name="phone_1" style={{ marginBottom: 0 }}>
                    <Input
                      placeholder="+380XXXXXXXXX"
                      disabled={!!createdPerson}
                      addonAfter={
                        <Form.Item name="phone_1_type" noStyle>
                          <Select
                            options={phoneTypeOptions}
                            style={{ width: 120 }}
                          />
                        </Form.Item>
                      }
                    />
                  </Form.Item>
                </div>
              </Flex>

              <Flex gap={12}>
                <div style={{ flex: 1 }}>
                  <Text style={compactLabelStyle}>Телефон 2</Text>
                  <Form.Item name="phone_2" style={{ marginBottom: 0 }}>
                    <Input
                      placeholder="+380XXXXXXXXX"
                      disabled={!!createdPerson}
                      addonAfter={
                        <Form.Item name="phone_2_type" noStyle>
                          <Select
                            options={phoneTypeOptions}
                            style={{ width: 120 }}
                          />
                        </Form.Item>
                      }
                    />
                  </Form.Item>
                </div>
              </Flex>

              <div>
                <Text style={compactLabelStyle}>Коментар</Text>
                <Form.Item name="comment" style={{ marginBottom: 0 }}>
                  <Input.TextArea disabled={!!createdPerson} />
                </Form.Item>
              </div>
            </Flex>
          </Card>

          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            disabled={!!createdPerson}
          >
            Створити контакт
          </Button>

          <Form
            form={assignmentForm}
            layout="vertical"
            onFinish={handleSaveAssignment}
          >
            <Card title="2. Місце служби">
              <Flex vertical gap={14}>
                <div>
                  <Text style={compactLabelStyle}>Організація</Text>
                  <Form.Item
                    name="organization"
                    style={{ marginBottom: 0 }}
                    rules={[{ required: true, message: 'Оберіть організацію' }]}
                  >
                    <Select
                      showSearch
                      placeholder={
                        createdPerson
                          ? 'Почніть вводити назву організації'
                          : 'Спочатку створіть контакт'
                      }
                      options={organizationOptions}
                      loading={organizationsLoading}
                      filterOption={false}
                      onSearch={loadOrganizationOptions}
                      onFocus={() => loadOrganizationOptions()}
                      disabled={!createdPerson}
                    />
                  </Form.Item>
                </div>

                <div>
                  <Text style={compactLabelStyle}>Посада</Text>
                  <Form.Item
                    name="position"
                    style={{ marginBottom: 0 }}
                    rules={[{ required: true, message: 'Оберіть посаду' }]}
                  >
                    <Select
                      showSearch
                      placeholder={
                        createdPerson
                          ? 'Почніть вводити назву посади'
                          : 'Спочатку створіть контакт'
                      }
                      options={positionOptions}
                      loading={positionsLoading}
                      filterOption={false}
                      onSearch={loadPositionOptions}
                      onFocus={() => loadPositionOptions()}
                      disabled={!createdPerson}
                    />
                  </Form.Item>
                </div>
              </Flex>
            </Card>

            <Flex justify="space-between" style={{ marginTop: 16 }}>
              <Button onClick={handleCloseDrawer}>Закрити</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={savingAssignment}
                disabled={!createdPerson}
              >
                Зберегти
              </Button>
            </Flex>
          </Form>
        </Flex>
      </Form>
    </Drawer>
  );
}

export default ContactCreateDrawer;
