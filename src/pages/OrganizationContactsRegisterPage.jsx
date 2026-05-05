// src/pages/OrganizationContactsRegisterPage.jsx

import { useEffect, useMemo, useState } from 'react';
import {
  AlertFilled,
  AppstoreAddOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Divider,
  Dropdown,
  Flex,
  Input,
  Select,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const isBirthdayToday = (day, month) => {
  if (!day || !month) return false;

  const now = new Date();

  return now.getDate() === Number(day) && now.getMonth() + 1 === Number(month);
};

function OrganizationContactsRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [debouncedSearchText, setDebouncedSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchText]);

  useEffect(() => {
    loadPeople(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchText]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearchText) {
      params.set('search', debouncedSearchText);
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [debouncedSearchText, currentPage, setSearchParams]);

  const loadPeople = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));

      if (debouncedSearchText) {
        params.append('search', debouncedSearchText);
      }

      const response = await api.get(`people-directory/?${params.toString()}`);

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load people directory:', err);
      setError('Не вдалося завантажити адресну книгу.');
      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: '№',
        key: 'row_number',
        width: 70,
        align: 'center',
        render: (_, __, index) => (currentPage - 1) * PAGE_SIZE + index + 1,
      },
      {
        title: 'Звання',
        dataIndex: 'rank_display',
        key: 'rank_display',
        width: 140,
        render: (value) => (value ? value.toLowerCase() : '—'),
      },
      {
        title: 'ПІБ',
        key: 'full_name',
        width: 280,
        render: (_, record) => {
          const fullName = record.full_name || '—';

          const hasBirthday = isBirthdayToday(
            record.birth_day,
            record.birth_month,
          );

          return (
            <Flex align="center" gap={8}>
              <Link to={`/contacts/${record.id}`}>{fullName}</Link>

              {hasBirthday ? (
                <Tooltip title="Сьогодні день народження">
                  <AlertFilled style={{ color: '#ff4d4f' }} />
                </Tooltip>
              ) : null}
            </Flex>
          );
        },
      },
      {
        title: 'Місце служби',
        key: 'assignment',
        width: 320,
        render: (_, record) => {
          if (
            !record.current_position_name ||
            !record.current_organization_name
          ) {
            return '—';
          }

          return `${record.current_position_name} в ${record.current_organization_name}`;
        },
      },
      {
        title: 'Дії',
        key: 'actions',
        width: 70,
        align: 'center',
        render: () => {
          const items = [
            {
              key: 'placeholder',
              label: (
                <div style={{ padding: '4px 0' }}>
                  Дії будуть додані пізніше
                </div>
              ),
            },
          ];

          return (
            <Dropdown menu={{ items }} trigger={['click']}>
              <AppstoreAddOutlined
                style={{
                  fontSize: 17,
                  color: '#8c8c8c',
                  cursor: 'pointer',
                }}
              />
            </Dropdown>
          );
        },
      },
    ],
    [currentPage],
  );

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Flex vertical gap={4}>
            <Title level={2} style={{ margin: 0 }}>
              Адресна книга
            </Title>

            <Text type="secondary">Реєстр контактів організацій.</Text>
          </Flex>

          <Button type="primary" size="large" icon={<PlusOutlined />}>
            Додати контакт
          </Button>
        </Flex>

        <Card size="small">
          <Flex align="center" wrap gap={16}>
            <Text>
              Обрано: <strong>{selectedRowKeys.length}</strong>
            </Text>

            <Select
              placeholder="Дії"
              style={{ width: 180 }}
              disabled={selectedRowKeys.length === 0}
              options={[{ value: 'placeholder', label: 'Дії' }]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Input
              placeholder="Пошук по ПІБ, телефону, коментарю або організації"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 320 }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Flex>
        </Card>

        {error && <Alert type="error" description={error} showIcon />}

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={items}
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
              onChange: (page) => setCurrentPage(page),
              showTotal: (totalValue, range) => (
                <span>
                  Показано{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {range[0]}–{range[1]}
                  </span>{' '}
                  з{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {totalValue}
                  </span>{' '}
                  контактів
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає контактів для відображення.',
            }}
            scroll={{ x: 900 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default OrganizationContactsRegisterPage;
