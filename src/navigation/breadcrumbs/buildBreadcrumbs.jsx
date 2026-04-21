import { breadcrumbConfig } from './breadcrumbConfig';
import { makeHomeItem } from './breadcrumbHelpers.jsx';

export function buildBreadcrumbs(location) {
  const { pathname, search, state } = location;

  const matchedEntry = breadcrumbConfig.find((entry) => entry.match(pathname));

  if (matchedEntry?.build) {
    return matchedEntry.build({ pathname, search, state });
  }

  return [makeHomeItem()];
}
