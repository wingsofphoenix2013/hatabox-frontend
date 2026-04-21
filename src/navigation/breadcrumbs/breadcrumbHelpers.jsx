import React from 'react';
import { Link } from 'react-router-dom';

const breadcrumbLinkStyle = {
  textDecoration: 'underline',
};

export function makeHomeItem() {
  return {
    title: (
      <Link to="/home" style={breadcrumbLinkStyle}>
        Головна
      </Link>
    ),
  };
}

export function makeTextItem(title) {
  return { title };
}

export function makeLinkItem(to, title, state) {
  return {
    title: (
      <Link to={to} style={breadcrumbLinkStyle} state={state}>
        {title}
      </Link>
    ),
  };
}

export function getCurrentId(pathname) {
  const pathParts = pathname.split('/');
  return pathParts[pathParts.length - 1];
}
