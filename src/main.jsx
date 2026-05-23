import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ukUA from 'antd/locale/uk_UA';
import dayjs from 'dayjs';
import 'dayjs/locale/uk';

import App from './App';
import 'antd/dist/reset.css';

dayjs.locale('uk');

ReactDOM.createRoot(document.getElementById('root')).render(
  <ConfigProvider locale={ukUA}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConfigProvider>,
);
