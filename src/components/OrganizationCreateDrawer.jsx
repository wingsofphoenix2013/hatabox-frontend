import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
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

const organizationTypeOptions = [
  { value: 'commercial', label: 'Комерційна' },
  { value: 'charity', label: 'Благодійна' },
  { value: 'military', label: 'Військова' },
];

const taxTypeOptions = [
  { value: 1, label: 'Єдиний податок' },
  { value: 2, label: 'Загальна система' },
];

const militaryTypeOptions = [
  { value: 'zsu', label: 'ЗСУ' },
  { value: 'ngu', label: 'НГУ' },
  { value: 'dpsu', label: 'ДПСУ' },
  { value: 'dsns', label: 'ДСНС' },
  { value: 'mvs', label: 'МВС' },
  { value: 'sbu', label: 'СБУ' },
];

const militaryBranchOptions = [
  { value: 'sv', label: 'СВ' },
  { value: 'ps', label: 'ПС' },
  { value: 'vms', label: 'ВМС' },
  { value: 'dshv', label: 'ДШВ' },
  { value: 'sbs', label: 'СБС' },
  { value: 'sp', label: 'СП' },
  { value: 'sl', label: 'СЛ' },
  { value: 'gur', label: 'ГУР' },
  { value: 'sso', label: 'ССО' },
  { value: 'tro', label: 'ТРО' },
  { value: 'kms', label: 'КМС' },
];

const militaryCorpsOptions = [
  { value: '1_nsu_azov', label: '1-й корпус НГУ «Азов»' },
  { value: '2_nsu_khartiia', label: '2-й корпус НГУ «Хартія»' },
  { value: '3_ak', label: '3-й армійський корпус' },
  { value: '7_dshv', label: '7-й корпус ДШВ' },
  { value: '8_dshv', label: '8-й корпус ДШВ' },
  { value: '9_ak', label: '9-й армійський корпус' },
  { value: '10_ak', label: '10-й армійський корпус' },
  { value: '11_ak', label: '11-й армійський корпус' },
  { value: '12_ak', label: '12-й армійський корпус' },
  { value: '14_ak', label: '14-й армійський корпус' },
  { value: '15_ak', label: '15-й армійський корпус' },
  { value: '16_ak', label: '16-й армійський корпус' },
  { value: '17_ak', label: '17-й армійський корпус' },
  { value: '18_ak', label: '18-й армійський корпус' },
  { value: '19_ak', label: '19-й армійський корпус' },
  { value: '20_ak', label: '20-й армійський корпус' },
  { value: '21_ak', label: '21-й армійський корпус' },
  { value: '30_marine_corps', label: '30-й корпус морської піхоти' },
];

function OrganizationCreateDrawer({ open, onClose, onCreated }) {
  const [organizationForm] = Form.useForm();
  const [profileForm] = Form.useForm();

  const [savingOrganization, setSavingOrganization] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [createdOrganization, setCreatedOrganization] = useState(null);

  useEffect(() => {
    if (!open) {
      organizationForm.resetFields();
      profileForm.resetFields();
      setSavingOrganization(false);
      setSavingProfile(false);
      setCreatedOrganization(null);
    }
  }, [open, organizationForm, profileForm]);

  const handleCloseDrawer = () => {
    organizationForm.resetFields();
    profileForm.resetFields();
    setCreatedOrganization(null);
    onClose();
  };

  const handleCreateOrganization = async (values) => {
    try {
      setSavingOrganization(true);

      const response = await api.post('organizations/', {
        name: values.name,
        legal_name: values.legal_name,
        type: values.type,
        edrpou: values.edrpou || '',
      });

      setCreatedOrganization(response.data);
      message.success('Організацію створено.');

      if (onCreated) {
        await onCreated();
      }
    } catch (err) {
      console.error('Failed to create organization:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'name',
        'legal_name',
        'type',
        'edrpou',
      ]);

      message.error(backendMessage || 'Не вдалося створити організацію.');
    } finally {
      setSavingOrganization(false);
    }
  };

  const handleSaveProfile = async (values) => {
    if (!createdOrganization) return;

    try {
      setSavingProfile(true);

      if (createdOrganization.type === 'commercial') {
        await api.post('commercial-organizations/', {
          organization: createdOrganization.id,
          tax_type: values.tax_type,
          ipn: values.ipn || '',
          legal_address: values.legal_address || '',
        });
      }

      if (createdOrganization.type === 'charity') {
        await api.post('charity-organizations/', {
          organization: createdOrganization.id,
          legal_address: values.legal_address || '',
        });
      }

      if (createdOrganization.type === 'military') {
        await api.post('military-organizations/', {
          organization: createdOrganization.id,
          a_code: values.a_code || '',
          military_type: values.military_type,
          military_branch: values.military_branch,
          military_corps: values.military_corps || '',
        });
      }

      message.success('Додаткову інформацію збережено.');
      handleCloseDrawer();

      if (onCreated) {
        await onCreated();
      }
    } catch (err) {
      console.error('Failed to save organization profile:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'organization',
        'tax_type',
        'ipn',
        'legal_address',
        'a_code',
        'military_type',
        'military_branch',
        'military_corps',
      ]);

      message.error(
        backendMessage || 'Не вдалося зберегти додаткову інформацію.',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const renderProfileFields = () => {
    if (!createdOrganization) return null;

    if (createdOrganization.type === 'commercial') {
      return (
        <>
          <div>
            <Text style={compactLabelStyle}>Тип оподаткування</Text>
            <Form.Item
              name="tax_type"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Оберіть тип оподаткування' }]}
            >
              <Select
                placeholder="Оберіть тип оподаткування"
                options={taxTypeOptions}
              />
            </Form.Item>
          </div>

          <div>
            <Text style={compactLabelStyle}>ІПН</Text>
            <Form.Item name="ipn" style={{ marginBottom: 0 }}>
              <Input placeholder="ІПН" />
            </Form.Item>
          </div>

          <div>
            <Text style={compactLabelStyle}>Юридична адреса</Text>
            <Form.Item name="legal_address" style={{ marginBottom: 0 }}>
              <Input placeholder="Юридична адреса" />
            </Form.Item>
          </div>
        </>
      );
    }

    if (createdOrganization.type === 'charity') {
      return (
        <div>
          <Text style={compactLabelStyle}>Юридична адреса</Text>
          <Form.Item name="legal_address" style={{ marginBottom: 0 }}>
            <Input placeholder="Юридична адреса" />
          </Form.Item>
        </div>
      );
    }

    if (createdOrganization.type === 'military') {
      return (
        <>
          <div>
            <Text style={compactLabelStyle}>Код військової частини</Text>
            <Form.Item name="a_code" style={{ marginBottom: 0 }}>
              <Input placeholder="Наприклад A1234" />
            </Form.Item>
          </div>

          <div>
            <Text style={compactLabelStyle}>Військовий тип</Text>
            <Form.Item
              name="military_type"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Оберіть військовий тип' }]}
            >
              <Select
                placeholder="Оберіть військовий тип"
                options={militaryTypeOptions}
              />
            </Form.Item>
          </div>

          <div>
            <Text style={compactLabelStyle}>Вид військ</Text>
            <Form.Item
              name="military_branch"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: 'Оберіть вид військ' }]}
            >
              <Select
                placeholder="Оберіть вид військ"
                options={militaryBranchOptions}
              />
            </Form.Item>
          </div>

          <div>
            <Text style={compactLabelStyle}>Корпус</Text>
            <Form.Item name="military_corps" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Оберіть корпус"
                options={militaryCorpsOptions}
                allowClear
              />
            </Form.Item>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <Drawer
      title="Створення організації"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
    >
      <Flex vertical gap={16}>
        <Form
          form={organizationForm}
          layout="vertical"
          onFinish={handleCreateOrganization}
        >
          <Card title="Шаг 1. Створіть організацію">
            <Flex vertical gap={14}>
              <div>
                <Text style={compactLabelStyle}>Коротка назва</Text>
                <Form.Item
                  name="name"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: 'Вкажіть коротку назву' }]}
                >
                  <Input
                    placeholder="Коротка назва"
                    disabled={!!createdOrganization}
                  />
                </Form.Item>
              </div>

              <div>
                <Text style={compactLabelStyle}>Юридична назва</Text>
                <Form.Item
                  name="legal_name"
                  style={{ marginBottom: 0 }}
                  rules={[
                    { required: true, message: 'Вкажіть юридичну назву' },
                  ]}
                >
                  <Input
                    placeholder="Юридична назва"
                    disabled={!!createdOrganization}
                  />
                </Form.Item>
              </div>

              <div>
                <Text style={compactLabelStyle}>Тип організації</Text>
                <Form.Item
                  name="type"
                  style={{ marginBottom: 0 }}
                  rules={[
                    { required: true, message: 'Оберіть тип організації' },
                  ]}
                >
                  <Select
                    placeholder="Оберіть тип організації"
                    options={organizationTypeOptions}
                    disabled={!!createdOrganization}
                  />
                </Form.Item>
              </div>

              <div>
                <Text style={compactLabelStyle}>ЄДРПОУ</Text>
                <Form.Item name="edrpou" style={{ marginBottom: 0 }}>
                  <Input
                    placeholder="ЄДРПОУ"
                    disabled={!!createdOrganization}
                  />
                </Form.Item>
              </div>
            </Flex>
          </Card>

          {!createdOrganization && (
            <Flex justify="space-between" gap={8} style={{ marginTop: 16 }}>
              <Button onClick={handleCloseDrawer}>Закрити</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={savingOrganization}
              >
                Створити організацію
              </Button>
            </Flex>
          )}
        </Form>

        {createdOrganization && (
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleSaveProfile}
          >
            <Card title="Шаг 2. Додаткова інформація">
              <Flex vertical gap={14}>
                {renderProfileFields()}
              </Flex>
            </Card>

            <Flex justify="space-between" gap={8} style={{ marginTop: 16 }}>
              <Button onClick={handleCloseDrawer}>Закрити</Button>
              <Button type="primary" htmlType="submit" loading={savingProfile}>
                Зберегти інформацію
              </Button>
            </Flex>
          </Form>
        )}
      </Flex>
    </Drawer>
  );
}

export default OrganizationCreateDrawer;
