/**
 * Vertexa Frontend API Configuration
 * Supports VITE_API_URL for production deployments or defaults to relative '/api'
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const API_ENDPOINTS = {
  health: `${BASE_URL}/api/health`,
  tasks: `${BASE_URL}/api/tasks`,
  navigate: `${BASE_URL}/api/navigate`,
  eligibility: `${BASE_URL}/api/eligibility`,
  linkStatus: (url) => `${BASE_URL}/api/link-status?url=${encodeURIComponent(url)}`,
  explainTerm: `${BASE_URL}/api/explain-term`
};

export default API_ENDPOINTS;
